"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Settings, Star, MoreHorizontal, Trash2 } from "lucide-react";
import type { RootState } from "@/store";
import type { Board } from "@/types";
import { getInitials } from "@/lib/utils";
import { UserButton } from "@/components/ui/user-button";
import api from "@/services/api";
import toast from "react-hot-toast";
import InviteMember from "./InviteMember";

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [boardDescription, setBoardDescription] = useState(
    board.description || ""
  );

  const isOwner = board.owner._id === user?._id;
  const totalMembers = board.collaborators.length + 1;

 
  const updateBoardMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const response = await api.put(`/boards/${board._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", board._id] });
      toast.success("Board updated successfully!");
      setShowSettingsDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update board");
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/boards/${board._id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board deleted successfully!");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete board");
    },
  });
  const handleUpdateBoard = () => {
    if (!boardTitle.trim()) return;
    updateBoardMutation.mutate({
      title: boardTitle,
      description: boardDescription,
    });
  };

  const handleDeleteBoard = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this board? This action cannot be undone and all lists and cards will be permanently deleted."
      )
    ) {
      deleteBoardMutation.mutate();
    }
  };

  return (
    <header className="sticky top-0 z-40 px-6 py-4 border-b border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center space-x-3">
            <div
              className="w-6 h-6 border-2 border-white rounded shadow-sm"
              style={{ backgroundColor: board.color }}
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {board.title}
              </h1>
              {board.description && (
                <p className="max-w-md text-sm text-gray-500 truncate">
                  {board.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Members */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {/* Owner */}
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src={board.owner.avatar} />
                <AvatarFallback className="text-xs text-white bg-blue-500">
                  {getInitials(board.owner.name)}
                </AvatarFallback>
              </Avatar>

              {/* Collaborators */}
              {board.collaborators.slice(0, 3).map((collaborator) => (
                <Avatar
                  key={collaborator.user._id}
                  className="w-8 h-8 border-2 border-white"
                >
                  <AvatarImage src={collaborator.user.avatar} />
                  <AvatarFallback className="text-xs text-white bg-gray-500">
                    {getInitials(collaborator.user.name)}
                  </AvatarFallback>
                </Avatar>
              ))}

              {board.collaborators.length > 3 && (
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 border-2 border-white rounded-full">
                  <span className="text-xs text-gray-600">
                    +{board.collaborators.length - 3}
                  </span>
                </div>
              )}
            </div>

            <Badge variant="secondary" className="text-xs">
              <Users className="size-4 mr-1" />
              {totalMembers}
            </Badge>
          </div>          {/* Actions */}
          <div className="flex items-center space-x-2">
            <InviteMember boardId={board._id} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>              <DropdownMenuContent align="end">
                {isOwner && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setShowSettingsDialog(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Board Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteBoard}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Board
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <Star className="w-4 h-4 mr-2" />
                  Add to Favorites
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton showLabel={false} size="md" />
          </div>
        </div>
      </div>

      {/* Board Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Board Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="boardTitle">Board Title</Label>
              <Input
                id="boardTitle"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="Enter board title"
              />
            </div>
            <div>
              <Label htmlFor="boardDescription">Description</Label>
              <Textarea
                id="boardDescription"
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                placeholder="Enter board description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateBoard}
                disabled={updateBoardMutation.isPending || !boardTitle.trim()}
              >
                {updateBoardMutation.isPending ? "Updating..." : "Update Board"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
