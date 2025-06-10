"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { X } from "lucide-react";
import { socketService } from "@/services/socket";
import api from "@/services/api";
import toast from "react-hot-toast";

interface CreateCardFormProps {
  listId: string;
  boardId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateCardForm({
  listId,
  boardId,
  onCancel,
  onSuccess,
}: CreateCardFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const createCardMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const response = await api.post(`/boards/${boardId}/cards`, {
        ...data,
        listId,
        position: 0, // Add to top of list
      });
      return response.data;
    },
    onSuccess: (newCard) => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      socketService.createCard({
        ...newCard,
        listId,
        boardId,
      });
      toast.success("Card created successfully!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create card");
    },
  });

  const handleSubmit = () => {
    if (title.trim()) {
      createCardMutation.mutate({
        title: title.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  return (
    <div className="p-3 space-y-3 bg-white border border-gray-200 rounded-lg">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for this card..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") onCancel();
        }}
      />

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description (optional)..."
        rows={3}
        className="resize-none"
      />

      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || createCardMutation.isPending}
        >
          {createCardMutation.isPending ? "Creating..." : "Add Card"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={createCardMutation.isPending}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
