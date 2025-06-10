import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { BoardHeader } from '@/components/board/BoardHeader'
import { setCurrentBoard } from '@/store/slices/boardSlice'
import { socketService } from '@/services/socket'
import api from '@/services/api'
import type { Board } from '@/types'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const dispatch = useDispatch()

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}`)
      return response.data as Board
    },
    enabled: !!boardId,
  })

  useEffect(() => {
    if (board) {
      dispatch(setCurrentBoard(board))
      socketService.joinBoard(board._id)
    }

    return () => {
      socketService.leaveBoard()
    }
  }, [board, dispatch])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Board not found</h2>
          <p className="text-muted-foreground">The board you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <BoardHeader board={board} />
      <KanbanBoard board={board} />
    </div>
  )
}