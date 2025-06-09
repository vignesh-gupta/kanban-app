"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  Star,
  MoreHorizontal,
  Crown,
  Mail,
} from "lucide-react";
import type { RootState } from "@/store";
import type { Board } from "@/types";
import { getInitials } from "@/lib/utils";
import api from "@/services/api";
import toast from "react-hot-toast";

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [boardDescription, setBoardDescription] = useState(
    board.description || ""
  );

  const isOwner = board.owner._id === user?._id;
  const totalMembers = board.collaborators.length + 1;

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post(`/boards/${board._id}/invite`, { email });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Invitation sent successfully!");
      setInviteEmail("");
      setShowInviteDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    },
  });

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

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(inviteEmail);
  };

  const handleUpdateBoard = () => {
    if (!boardTitle.trim()) return;
    updateBoardMutation.mutate({
      title: boardTitle,
      description: boardDescription,
    });
  };

  return (
    <header className="sticky top-0 z-40 px-6 py-4 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Boards
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
              <div className="relative">
                <Avatar className="w-8 h-8 border-2 border-white">
                  <AvatarImage src={board.owner.avatar} />
                  <AvatarFallback className="text-xs text-white bg-blue-500">
                    {getInitials(board.owner.name)}
                  </AvatarFallback>
                </Avatar>
                <Crown className="absolute w-3 h-3 text-yellow-500 -top-1 -right-1" />
              </div>

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
              <Users className="w-3 h-3 mr-1" />
              {totalMembers}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isOwner && (
              <Dialog
                open={showInviteDialog}
                onOpenChange={setShowInviteDialog}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Collaborator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowInviteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInvite}
                        disabled={
                          inviteMutation.isPending || !inviteEmail.trim()
                        }
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {inviteMutation.isPending
                          ? "Sending..."
                          : "Send Invitation"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setShowSettingsDialog(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Board Settings
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
          </div>
        </div>
      </div>

      {/* Board Settings Dialog */}
      {isOwner && (
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
                  {updateBoardMutation.isPending
                    ? "Updating..."
                    : "Update Board"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}
