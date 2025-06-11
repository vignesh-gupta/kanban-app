"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
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
import { useCardMove } from "@/hooks/use-card-move.ts";

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

  const { mutateAsync: moveCardMutation } = useCardMove(board);

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

  const handleDragEnd = async (event: DragEndEvent) => {
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
        const overCard = over.data.current?.card as CardType; // Same list reordering

        if (activeCard._id === overCard._id) return;

        if (activeCard.listId === overCard.listId) {
          const sourceList = board.lists.find(
            (list) => list._id === activeCard.listId
          );

          if (!sourceList) return;
          const oldIndex = sourceList.cards.findIndex(
            (card) => card._id === activeCard._id
          );
          const newIndex = sourceList.cards.findIndex(
            (card) => card._id === overCard._id
          );

          const list = board.lists.find(
            (list) => list._id === activeCard.listId
          );

          if (list) {
            arrayMove(list.cards, oldIndex, newIndex);
          }

          if (oldIndex !== newIndex) {
            // Calculate the correct position for reordering within the same list
            const targetPosition = newIndex > oldIndex ? newIndex : newIndex;

            await moveCardMutation({
              cardId: activeCard._id,
              toListId: activeCard.listId,
              position: targetPosition,
            });
          }
        } // Cross-list movement
        else if (activeCard.listId !== overCard.listId) {
          const targetList = board.lists.find(
            (list) => list._id === overCard.listId
          );
          if (targetList) {
            const newIndex = targetList.cards.findIndex(
              (card) => card._id === overCard._id
            );

            await moveCardMutation({
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
          await moveCardMutation({
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
        onDragEnd={handleDragEnd}
      >
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-6 p-6 min-w-max">
            <SortableContext
              items={board.lists.map((list) => list._id)}
              strategy={horizontalListSortingStrategy}            >
              {board.lists.map((list) => (
                <KanbanList key={list._id} list={list} boardId={board._id} board={board} />
              ))}
            </SortableContext>

            <CreateListButton
              onCreateList={handleCreateList}
              isLoading={createListMutation.isPending}
            />
          </div>
        </div>        <DragOverlay>
          {activeCard && (
            <div className="rotate-3 opacity-90">
              <KanbanCard card={activeCard} isDragging board={board} />
            </div>
          )}
          {activeList && (
            <div className="rotate-2 opacity-90">
              <KanbanList list={activeList} boardId={board._id} isDragging board={board} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
