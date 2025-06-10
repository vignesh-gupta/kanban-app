import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { BoardCard } from "../components/board/BoardCard";
import { CreateBoardDialog } from "../components/board/CreateBoardDialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Plus, Search, Grid, List } from "lucide-react";
import api from "../services/api";
import type { Board } from "../types";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const response = await api.get("/boards");
      return response.data as Board[];
    },
  });

  const filteredBoards = boards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-white/50 backdrop-blur-sm">
        <div className="container px-4 py-4 mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Boards</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>

              <div className="flex items-center p-1 space-x-1 rounded-lg bg-muted">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        {filteredBoards.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 rounded-full bg-muted">
                <Plus className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {boards.length === 0 ? "No boards yet" : "No boards found"}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {boards.length === 0
                  ? "Create your first board to start organizing your tasks"
                  : "Try adjusting your search terms"}
              </p>
              {boards.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Board
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredBoards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onClick={() => handleBoardClick(board._id)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateBoardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
