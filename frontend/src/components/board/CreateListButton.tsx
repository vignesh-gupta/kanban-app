"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Plus, X } from "lucide-react";

interface CreateListButtonProps {
  onCreateList: (title: string) => void;
  isLoading?: boolean;
}

export function CreateListButton({
  onCreateList,
  isLoading = false,
}: CreateListButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onCreateList(title.trim());
      setTitle("");
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <Card className="flex-shrink-0 border-gray-200 w-80 bg-gray-50">
        <CardContent className="p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter list title..."
            className="mb-3"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim() || isLoading}
            >
              {isLoading ? "Creating..." : "Add List"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      variant="ghost"
      className="flex-shrink-0 h-12 text-gray-600 bg-gray-100 border-2 border-gray-300 border-dashed w-80 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800"
      onClick={() => setIsCreating(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Add another list
    </Button>
  );
}
