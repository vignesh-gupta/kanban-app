"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  User,
  Tag,
  Clock,
  Send,
  Edit3,
  Save,
  CalendarIcon,
} from "lucide-react";
import type { Card as CardType, Board, User as UserType } from "@/types";
import { getInitials, formatDate } from "@/lib/utils";
import { socketService } from "@/services/socket";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CardDetailDialogProps {
  card: CardType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board?: Board;
}

export function CardDetailDialog({
  card,
  open,
  onOpenChange,
  board,
}: CardDetailDialogProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.dueDate ? new Date(card.dueDate) : ""
  );
  const [newComment, setNewComment] = useState("");
  const [assignee, setAssignee] = useState(card.assignee?._id || "none");

  const queryClient = useQueryClient();

  const { user } = useSelector((state: RootState) => state.auth);

  // Get board members for assignee dropdown
  const boardMembers: UserType[] = board
    ? [board.owner, ...board.collaborators.map((c) => c.user)]
    : [];
  const updateCardMutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      description?: string;
      assignee?: string | null;
      dueDate?: string;
    }) => {
      const response = await api.put(`/boards/cards/${card._id}`, data);
      return response.data;
    },
    onSuccess: (updatedCard) => {
      queryClient.invalidateQueries({ queryKey: ["board", card.boardId] });
      socketService.updateCard(updatedCard);
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
      const response = await api.post(`/boards/cards/${card._id}/comments`, {
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

  const handleAssignUser = (userId: string | null) => {
    const finalUserId = !userId || userId === "none" ? null : userId;

    console.log("Assigning User ID:", finalUserId);

    setAssignee(finalUserId || "none");
    updateCardMutation.mutate({
      assignee: finalUserId,
    });
  };

  const handleUpdateDueDate = (newDueDate: Date | undefined) => {
    setDueDate(newDueDate || "");
    updateCardMutation.mutate({
      dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                    <Save className="size-4" />
                  </Button>
                </div>
              ) : (
                <DialogTitle
                  className="flex items-center space-x-2 text-xl transition-colors cursor-pointer hover:text-blue-600"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <span>{card.title}</span>
                  <Edit3 className="size-4 opacity-50" />
                </DialogTitle>
              )}

              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
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
                  <Tag className="size-4" />
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
                <MessageSquare className="size-4" />
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
                <MessageSquare className="size-4" />
                <span className="text-sm font-medium">Comments</span>
                <Badge variant="secondary">{card.comments.length}</Badge>
              </div>

              {/* Add Comment */}
              <div className="flex mb-4 space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs text-white bg-blue-500">
                    {getInitials(user?.name || "U")}
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
                    <Send className="size-4 mr-2" />
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
              <div className="flex justify-between mb-2 flex-col">
                <div className="flex items-center space-x-2">
                  <User className="size-4" />
                  <span className="text-sm font-medium">Members</span>
                </div>

                <Select onValueChange={handleAssignUser}>
                  <SelectTrigger value={assignee}>
                    <SelectValue placeholder="Select a assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {boardMembers.map((member) => (
                      <SelectItem value={member._id} key={member._id}>
                        <Avatar className="size-4 mr-1">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs text-white bg-gray-500">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </SelectItem>
                    ))}
                    <SelectItem value="none">No assignee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator /> {/* Due Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="size-4" />
                  <span className="text-sm font-medium">Due Date</span>
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!dueDate && !card.dueDate}
                    className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
                  >
                    <CalendarIcon />
                    {dueDate ? (
                      format(dueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(dueDate || "")}
                    onSelect={handleUpdateDueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Separator />
            {/* Created */}
            <div>
              <div className="flex items-center mb-2 space-x-2">
                <CalendarIcon className="size-4" />
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
