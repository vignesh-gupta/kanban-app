"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import {
  Calendar,
  MessageSquare,
  User,
  Tag,
  Clock,
  Send,
  Edit3,
  Save,
} from "lucide-react";
import type { Card as CardType } from "@/types";
import { getInitials, formatDate } from "@/lib/utils";
import { socketService } from "@/services/socket";
import api from "@/services/api";
import toast from "react-hot-toast";

interface CardDetailDialogProps {
  card: CardType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetailDialog({
  card,
  open,
  onOpenChange,
}: CardDetailDialogProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const updateCardMutation = useMutation({
    mutationFn: async (data: { title?: string; description?: string }) => {
      const response = await api.put(`/cards/${card._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", card.boardId] });
      socketService.updateCard({ ...card, title, description });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      toast.success("Card updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update card");
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/cards/${card._id}/comments`, {
        content,
      });
      return response.data;
    },
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ["board", card.boardId] });
      socketService.createComment({
        ...newComment,
        cardId: card._id,
      });
      setNewComment("");
      toast.success("Comment added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add comment");
    },
  });

  const handleUpdateTitle = () => {
    if (title.trim() && title !== card.title) {
      updateCardMutation.mutate({ title: title.trim() });
    } else {
      setTitle(card.title);
      setIsEditingTitle(false);
    }
  };

  const handleUpdateDescription = () => {
    if (description !== card.description) {
      updateCardMutation.mutate({ description: description.trim() });
    } else {
      setIsEditingDescription(false);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleUpdateTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateTitle();
                      if (e.key === "Escape") {
                        setTitle(card.title);
                        setIsEditingTitle(false);
                      }
                    }}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleUpdateTitle}>
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <DialogTitle
                  className="flex items-center space-x-2 text-xl transition-colors cursor-pointer hover:text-blue-600"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <span>{card.title}</span>
                  <Edit3 className="w-4 h-4 opacity-50" />
                </DialogTitle>
              )}

              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                <span>in list</span>
                <span className="font-medium">List Name</span>
                <span>•</span>
                <span>Created {formatDate(card.createdAt)}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Labels */}
            {card.labels.length > 0 && (
              <div>
                <div className="flex items-center mb-2 space-x-2">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">Labels</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.labels.map((label) => (
                    <Badge
                      key={label._id}
                      variant="secondary"
                      style={{
                        backgroundColor: label.color + "20",
                        color: label.color,
                        border: `1px solid ${label.color}40`,
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center mb-2 space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Description</span>
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleUpdateDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDescription(card.description || "");
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="min-h-[60px] p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {description ? (
                    <p className="text-sm whitespace-pre-wrap">{description}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Add a more detailed description...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center mb-4 space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Comments</span>
                <Badge variant="secondary">{card.comments.length}</Badge>
              </div>

              {/* Add Comment */}
              <div className="flex mb-4 space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs text-white bg-blue-500">
                    {getInitials("Current User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={
                      !newComment.trim() || createCommentMutation.isPending
                    }
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createCommentMutation.isPending ? "Posting..." : "Comment"}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {card.comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback className="text-xs text-white bg-gray-500">
                        {getInitials(comment.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1 space-x-2">
                          <span className="text-sm font-medium">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Assignees */}
            <div>
              <div className="flex items-center mb-2 space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Members</span>
              </div>
              <div className="space-y-2">
                {card.assignees.map((assignee) => (
                  <div
                    key={assignee._id}
                    className="flex items-center space-x-2"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={assignee.avatar} />
                      <AvatarFallback className="text-xs text-white bg-blue-500">
                        {getInitials(assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{assignee.name}</span>
                  </div>
                ))}
                {card.assignees.length === 0 && (
                  <p className="text-sm text-gray-500">No members assigned</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Due Date */}
            <div>
              <div className="flex items-center mb-2 space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Due Date</span>
              </div>
              {card.dueDate ? (
                <div className="text-sm text-gray-600">
                  {formatDate(card.dueDate)}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No due date</p>
              )}
            </div>

            <Separator />

            {/* Created */}
            <div>
              <div className="flex items-center mb-2 space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={card.createdBy.avatar} />
                  <AvatarFallback className="text-xs text-white bg-gray-500">
                    {getInitials(card.createdBy.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm">{card.createdBy.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(card.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
