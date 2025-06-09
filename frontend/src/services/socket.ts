import { io, Socket } from 'socket.io-client'
import { store } from '../store'
import { 
  updateBoard, 
  addList, 
  updateList, 
  deleteList,
  addCard,
  updateCard,
  deleteCard,
  moveCard,
  addComment,
  addConnectedUser,
  removeConnectedUser 
} from '../store/slices/boardSlice'

class SocketService {
  private socket: Socket | null = null
  private currentBoardId: string | null = null

  connect(token: string) {
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    this.setupEventListeners()
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinBoard(boardId: string) {
    if (this.socket && this.currentBoardId !== boardId) {
      if (this.currentBoardId) {
        this.socket.emit('leave-board', this.currentBoardId)
      }
      this.socket.emit('join-board', boardId)
      this.currentBoardId = boardId
    }
  }

  leaveBoard() {
    if (this.socket && this.currentBoardId) {
      this.socket.emit('leave-board', this.currentBoardId)
      this.currentBoardId = null
    }
  }

  // Board events
  updateBoard(board: any) {
    this.socket?.emit('board.update', board)
  }

  // List events
  createList(listData: any) {
    this.socket?.emit('list.create', listData)
  }

  updateList(list: any) {
    this.socket?.emit('list.update', list)
  }

  deleteList(listId: string) {
    this.socket?.emit('list.delete', { listId })
  }

  reorderLists(lists: any[]) {
    this.socket?.emit('list.reorder', { lists })
  }

  // Card events
  createCard(cardData: any) {
    this.socket?.emit('card.create', cardData)
  }

  updateCard(card: any) {
    this.socket?.emit('card.update', card)
  }

  deleteCard(cardId: string) {
    this.socket?.emit('card.delete', { cardId })
  }

  moveCard(cardId: string, fromListId: string, toListId: string, position: number) {
    this.socket?.emit('card.move', { cardId, fromListId, toListId, position })
  }

  // Comment events
  createComment(commentData: any) {
    this.socket?.emit('comment.create', commentData)
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Board events
    this.socket.on('board.update', (board) => {
      store.dispatch(updateBoard(board))
    })

    // List events
    this.socket.on('list.create', (list) => {
      store.dispatch(addList(list))
    })

    this.socket.on('list.update', (list) => {
      store.dispatch(updateList(list))
    })

    this.socket.on('list.delete', ({ listId }) => {
      store.dispatch(deleteList(listId))
    })

    // Card events
    this.socket.on('card.create', (card) => {
      store.dispatch(addCard(card))
    })

    this.socket.on('card.update', (card) => {
      store.dispatch(updateCard(card))
    })

    this.socket.on('card.delete', ({ cardId }) => {
      store.dispatch(deleteCard(cardId))
    })

    this.socket.on('card.move', ({ cardId, fromListId, toListId, position }) => {
      store.dispatch(moveCard({ cardId, fromListId, toListId, position }))
    })

    // Comment events
    this.socket.on('comment.create', (comment) => {
      store.dispatch(addComment(comment))
    })

    // User presence
    this.socket.on('user.join', ({ userId }) => {
      store.dispatch(addConnectedUser(userId))
    })

    this.socket.on('user.leave', ({ userId }) => {
      store.dispatch(removeConnectedUser(userId))
    })
  }
}

export const socketService = new SocketService()