"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  MessageSquare,
  MoreHorizontal,
  Edit3,
  Trash2,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { Card as CardType } from "@/types";
import { getInitials, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CardDetailDialog } from "./CardDetailDialog";

interface KanbanCardProps {
  card: CardType;
  isDragging?: boolean;
}

export function KanbanCard({ card, isDragging = false }: KanbanCardProps) {
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card._id,
    data: {
      type: "card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
  const isDueSoon =
    card.dueDate &&
    new Date(card.dueDate) > new Date() &&
    new Date(card.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000); // Due within 24 hours

  if (isDragging) {
    return (
      <Card className="bg-white border-2 border-gray-300 border-dashed opacity-50">
        <CardContent className="p-3">
          <h4 className="mb-2 text-sm font-medium text-gray-500">
            {card.title}
          </h4>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer group",
          isSortableDragging && "opacity-50 rotate-3",
          "hover:shadow-md"
        )}
        {...attributes}
        {...listeners}
        onClick={() => setShowDetailDialog(true)}
      >
        <CardContent className="p-3">
          {/* Labels */}
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map((label) => (
                <Badge
                  key={label._id}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
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
          )}

          {/* Title */}
          <h4 className="mb-2 text-sm font-medium text-gray-900 line-clamp-2">
            {card.title}
          </h4>

          {/* Description preview */}
          {card.description && (
            <p className="mb-3 text-xs text-gray-600 line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Due date */}
          {card.dueDate && (
            <div
              className={cn(
                "flex items-center text-xs mb-2 px-2 py-1 rounded",
                isOverdue && "bg-red-50 text-red-700",
                isDueSoon && !isOverdue && "bg-yellow-50 text-yellow-700",
                !isOverdue && !isDueSoon && "bg-gray-50 text-gray-600"
              )}
            >
              {isOverdue ? (
                <AlertCircle className="w-3 h-3 mr-1" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              <span>{formatDate(card.dueDate)}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Comments count */}
              {card.comments.length > 0 && (
                <div className="flex items-center text-xs text-gray-500">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  <span>{card.comments.length}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {/* Assignees */}
              {card.assignees.length > 0 && (
                <div className="flex -space-x-1">
                  {card.assignees.slice(0, 3).map((assignee) => (
                    <Avatar
                      key={assignee._id}
                      className="w-6 h-6 border-2 border-white"
                    >
                      <AvatarImage src={assignee.avatar} />
                      <AvatarFallback className="text-xs text-white bg-blue-500">
                        {getInitials(assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {card.assignees.length > 3 && (
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 border-2 border-white rounded-full">
                      <span className="text-xs text-gray-600">
                        +{card.assignees.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Card menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 transition-opacity opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem onClick={() => setShowDetailDialog(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Card
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Card
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <CardDetailDialog
        card={card}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </>
  );
}
