import { formatDate } from "@/lib/utils";
import type { Board } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Users, Calendar } from "lucide-react";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
}

export function BoardCard({ board, onClick }: BoardCardProps) {
  const totalMembers = board.collaborators.length + 1; // +1 for owner

  return (
    <Card
      className="cursor-pointer card-hover card-transition group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="w-4 h-4 border-2 border-white rounded-full shadow-sm"
            style={{ backgroundColor: board.color }}
          />
          <Badge variant="secondary" className="text-xs">
            {board.lists.length} lists
          </Badge>
        </div>
        <CardTitle className="text-lg transition-colors group-hover:text-primary">
          {board.title}
        </CardTitle>
        {board.description && (
          <CardDescription className="line-clamp-2">
            {board.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>
              {totalMembers} member{totalMembers !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(board.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
