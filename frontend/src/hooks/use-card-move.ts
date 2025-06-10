import { useMutation, useQueryClient } from "@tanstack/react-query";
import { socketService } from "@/services/socket";
import api from "@/services/api";
import toast from "react-hot-toast";
import type { Board } from "@/types";

export const useCardMove = (board: Board) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      cardId: string;
      toListId: string;
      position: number;
    }) => {
      console.log("Moving card:", data);

      const response = await api.put(`/boards/cards/${data.cardId}/move`, {
        listId: data.toListId,
        position: data.position,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", board._id] });
      // Find the fromListId by looking up the card in the current board
      const fromList = board.lists.find((list) =>
        list.cards.some((card) => card._id === variables.cardId)
      );
      const fromListId = fromList?._id || variables.toListId;

      socketService.moveCard(
        variables.cardId,
        fromListId,
        variables.toListId,
        variables.position
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to move card");
      queryClient.invalidateQueries({ queryKey: ["board", board._id] });
    },
  });
};
