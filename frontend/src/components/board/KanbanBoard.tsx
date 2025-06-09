"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { setDraggedCard } from "@/store/slices/uiSlice";
import type { Board, Card as CardType, List as ListType } from "@/types";
import { KanbanList } from "./KanbanList";
import { KanbanCard } from "./KanbanCard";
import { CreateListButton } from "./CreateListButton.tsx";
import { socketService } from "@/services/socket";
import api from "@/services/api";
import toast from "react-hot-toast";

interface KanbanBoardProps {
  board: Board;
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeList, setActiveList] = useState<ListType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const createListMutation = useMutation({
    mutationFn: async (data: { title: string; position: number }) => {
      const response = await api.post(`/boards/${board._id}/lists`, data);
      return response.data;
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ["board", board._id] });
      socketService.createList({
        ...newList,
        boardId: board._id,
      });
      toast.success("List created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create list");
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: async (data: {
      cardId: string;
      toListId: string;
      position: number;
    }) => {
      const response = await api.put(`/cards/${data.cardId}/move`, {
        listId: data.toListId,
        position: data.position,
      });
      return response.data;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["board", board._id] });
      
      // Snapshot the previous value
      const previousBoard = queryClient.getQueryData(["board", board._id]);
      
      // Optimistically update the board
      queryClient.setQueryData(["board", board._id], (old: any) => {
        if (!old) return old;
        
        const newBoard = { ...old };
        const fromList = newBoard.lists.find((list: any) => 
          list.cards.some((card: any) => card._id === variables.cardId)
        );
        const toList = newBoard.lists.find((list: any) => list._id === variables.toListId);
        
        if (fromList && toList) {
          const cardIndex = fromList.cards.findIndex((card: any) => card._id === variables.cardId);
          if (cardIndex !== -1) {
            const [card] = fromList.cards.splice(cardIndex, 1);
            card.listId = variables.toListId;
            card.position = variables.position;
            toList.cards.splice(variables.position, 0, card);
          }
        }
        
        return newBoard;
      });
      
      return { previousBoard };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", board._id] });
      // Find the fromListId by looking up the card in the current board
      const fromList = board.lists.find(list => 
        list.cards.some(card => card._id === variables.cardId)
      );
      const fromListId = fromList?._id || variables.toListId;
      
      socketService.moveCard(
        variables.cardId,
        fromListId,
        variables.toListId,
        variables.position
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to move card");
      queryClient.invalidateQueries({ queryKey: ["board", board._id] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === "card") {
      const card = active.data.current.card as CardType;
      setActiveCard(card);
      dispatch(setDraggedCard(card._id));
    } else if (active.data.current?.type === "list") {
      const list = active.data.current.list as ListType;
      setActiveList(list);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Card over card in different list
    if (activeType === "card" && overType === "card") {
      const activeCard = active.data.current?.card as CardType;
      const overCard = over.data.current?.card as CardType;

      if (activeCard.listId !== overCard.listId) {
        // Handle cross-list card movement
        // This will be handled in dragEnd
      }
    }

    // Card over list
    if (activeType === "card" && overType === "list") {
      const activeCard = active.data.current?.card as CardType;
      const overList = over.data.current?.list as ListType;

      if (activeCard.listId !== overList._id) {
        // Handle cross-list card movement
        // This will be handled in dragEnd
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);
    setActiveList(null);
    dispatch(setDraggedCard(null));

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Handle card movement
    if (activeType === "card") {
      const activeCard = active.data.current?.card as CardType;

      if (overType === "card") {
        const overCard = over.data.current?.card as CardType;        // Same list reordering
        if (
          activeCard.listId === overCard.listId &&
          activeCard._id !== overCard._id
        ) {
          const sourceList = board.lists.find(
            (list) => list._id === activeCard.listId
          );
          if (sourceList) {
            const oldIndex = sourceList.cards.findIndex(
              (card) => card._id === activeCard._id
            );
            const newIndex = sourceList.cards.findIndex(
              (card) => card._id === overCard._id
            );

            if (oldIndex !== newIndex) {
              // Calculate the correct position for reordering within the same list
              const targetPosition = newIndex > oldIndex ? newIndex : newIndex;
              
              moveCardMutation.mutate({
                cardId: activeCard._id,
                toListId: activeCard.listId,
                position: targetPosition,
              });
            }
          }
        }        // Cross-list movement
        else if (activeCard.listId !== overCard.listId) {
          const targetList = board.lists.find(
            (list) => list._id === overCard.listId
          );
          if (targetList) {
            const newIndex = targetList.cards.findIndex(
              (card) => card._id === overCard._id
            );

            moveCardMutation.mutate({
              cardId: activeCard._id,
              toListId: overCard.listId,
              position: Math.max(0, newIndex),
            });
          }
        }
      }
      // Card dropped on list
      else if (overType === "list") {
        const overList = over.data.current?.list as ListType;

        if (activeCard.listId !== overList._id) {
          moveCardMutation.mutate({
            cardId: activeCard._id,
            toListId: overList._id,
            position: overList.cards.length,
          });
        }
      }
    }
  };

  const handleCreateList = (title: string) => {
    createListMutation.mutate({
      title,
      position: board.lists.length,
    });
  };

  return (
    <div className="flex-1 overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-6 p-6 min-w-max">
            <SortableContext
              items={board.lists.map((list) => list._id)}
              strategy={horizontalListSortingStrategy}
            >
              {board.lists.map((list) => (
                <KanbanList key={list._id} list={list} boardId={board._id} />
              ))}
            </SortableContext>

            <CreateListButton
              onCreateList={handleCreateList}
              isLoading={createListMutation.isPending}
            />
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="rotate-3 opacity-90">
              <KanbanCard card={activeCard} isDragging />
            </div>
          )}
          {activeList && (
            <div className="rotate-2 opacity-90">
              <KanbanList list={activeList} boardId={board._id} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
