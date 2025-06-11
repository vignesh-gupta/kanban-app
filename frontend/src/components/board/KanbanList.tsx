"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Trash2, Edit3 } from "lucide-react";
import type { List, Board } from "@/types";
import { KanbanCard } from "./KanbanCard";
import { CreateCardForm } from "./CreateCardForm";
import { socketService } from "@/services/socket";
import api from "@/services/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface KanbanListProps {
  list: List;
  boardId: string;
  isDragging?: boolean;
  board?: Board;
}

export function KanbanList({
  list,
  boardId,
  isDragging = false,
  board,
}: KanbanListProps) {
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const queryClient = useQueryClient();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: list._id,
    data: {
      type: "list",
      list,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `list-droppable-${list._id}`,
    data: {
      type: "list",
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateListMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      const response = await api.put(`/lists/${list._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      socketService.updateList({ ...list, title });
      setIsEditingTitle(false);
      toast.success("List updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update list");
      setTitle(list.title); // Reset title on error
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/lists/${list._id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      socketService.deleteList(list._id);
      toast.success("List deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete list");
    },
  });

  const handleUpdateTitle = () => {
    if (title.trim() && title !== list.title) {
      updateListMutation.mutate({ title: title.trim() });
    } else {
      setTitle(list.title);
      setIsEditingTitle(false);
    }
  };

  const handleDeleteList = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this list? All cards will be deleted."
      )
    ) {
      deleteListMutation.mutate();
    }
  };

  const handleCardCreated = () => {
    setShowCreateCard(false);
  };

  if (isDragging) {
    return (
      <Card className="border-2 border-gray-300 border-dashed w-80 bg-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-500">{list.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {list.cards.length}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-80 bg-gray-50 border-gray-200 flex flex-col max-h-full",
        isSortableDragging && "opacity-50"
      )}
    >
      <CardHeader
        className="pb-3 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center justify-between">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateTitle();
                if (e.key === "Escape") {
                  setTitle(list.title);
                  setIsEditingTitle(false);
                }
              }}
              className="h-8 text-sm font-medium"
              autoFocus
            />
          ) : (
            <h3
              className="font-medium text-gray-900 transition-colors cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingTitle(true)}
            >
              {list.title} {list._id}
            </h3>
          )}

          <div className="flex items-center space-x-1">
            <Badge variant="secondary" className="text-xs">
              {list.cards.length}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Title
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteList}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 pt-0 overflow-hidden">
        {" "}
        <div
          ref={setDroppableRef}
          className={cn(
            "flex-1 mb-3 space-y-3 overflow-y-auto min-h-[100px] p-2 rounded-lg transition-colors",
            isOver && "bg-blue-50 border-2 border-blue-200 border-dashed"
          )}
        >          <SortableContext
            items={list.cards.map((card) => card._id)}
            strategy={verticalListSortingStrategy}
          >
            {list.cards.map((card) => (
              <KanbanCard key={card._id} card={card} board={board} />
            ))}
          </SortableContext>

          {list.cards.length === 0 && (
            <div
              className={cn(
                "flex items-center justify-center h-20 text-sm text-gray-500 border-2 border-gray-200 border-dashed rounded-lg transition-colors",
                isOver && "border-blue-300 text-blue-600 bg-blue-50"
              )}
            >
              {isOver ? "Drop card here" : "No cards yet"}
            </div>
          )}
        </div>
        {showCreateCard ? (
          <CreateCardForm
            listId={list._id}
            boardId={boardId}
            onCancel={() => setShowCreateCard(false)}
            onSuccess={handleCardCreated}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateCard(true)}
            className="justify-start w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a card
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
