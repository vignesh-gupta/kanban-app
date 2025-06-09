import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Board, List, Card, Comment } from '@/types'

interface BoardState {
  currentBoard: Board | null
  boards: Board[]
  isLoading: boolean
  connectedUsers: string[]
}

const initialState: BoardState = {
  currentBoard: null,
  boards: [],
  isLoading: false,
  connectedUsers: [],
}

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setBoards: (state, action: PayloadAction<Board[]>) => {
      state.boards = action.payload
    },
    setCurrentBoard: (state, action: PayloadAction<Board>) => {
      state.currentBoard = action.payload
    },
    addBoard: (state, action: PayloadAction<Board>) => {
      state.boards.push(action.payload)
    },
    updateBoard: (state, action: PayloadAction<Board>) => {
      const index = state.boards.findIndex(b => b._id === action.payload._id)
      if (index !== -1) {
        state.boards[index] = action.payload
      }
      if (state.currentBoard?._id === action.payload._id) {
        state.currentBoard = action.payload
      }
    },
    deleteBoard: (state, action: PayloadAction<string>) => {
      state.boards = state.boards.filter(b => b._id !== action.payload)
      if (state.currentBoard?._id === action.payload) {
        state.currentBoard = null
      }
    },
    addList: (state, action: PayloadAction<List>) => {
      if (state.currentBoard) {
        state.currentBoard.lists.push(action.payload)
      }
    },
    updateList: (state, action: PayloadAction<List>) => {
      if (state.currentBoard) {
        const index = state.currentBoard.lists.findIndex(l => l._id === action.payload._id)
        if (index !== -1) {
          state.currentBoard.lists[index] = action.payload
        }
      }
    },
    deleteList: (state, action: PayloadAction<string>) => {
      if (state.currentBoard) {
        state.currentBoard.lists = state.currentBoard.lists.filter(l => l._id !== action.payload)
      }
    },
    reorderLists: (state, action: PayloadAction<List[]>) => {
      if (state.currentBoard) {
        state.currentBoard.lists = action.payload
      }
    },
    addCard: (state, action: PayloadAction<Card>) => {
      if (state.currentBoard) {
        const list = state.currentBoard.lists.find(l => l._id === action.payload.listId)
        if (list) {
          list.cards.push(action.payload)
        }
      }
    },
    updateCard: (state, action: PayloadAction<Card>) => {
      if (state.currentBoard) {
        const list = state.currentBoard.lists.find(l => l._id === action.payload.listId)
        if (list) {
          const index = list.cards.findIndex(c => c._id === action.payload._id)
          if (index !== -1) {
            list.cards[index] = action.payload
          }
        }
      }
    },
    deleteCard: (state, action: PayloadAction<string>) => {
      if (state.currentBoard) {
        state.currentBoard.lists.forEach(list => {
          list.cards = list.cards.filter(c => c._id !== action.payload)
        })
      }
    },
    moveCard: (state, action: PayloadAction<{ cardId: string; fromListId: string; toListId: string; position: number }>) => {
      if (state.currentBoard) {
        const { cardId, fromListId, toListId, position } = action.payload
        const fromList = state.currentBoard.lists.find(l => l._id === fromListId)
        const toList = state.currentBoard.lists.find(l => l._id === toListId)
        
        if (fromList && toList) {
          const cardIndex = fromList.cards.findIndex(c => c._id === cardId)
          if (cardIndex !== -1) {
            const [card] = fromList.cards.splice(cardIndex, 1)
            card.listId = toListId
            card.position = position
            toList.cards.splice(position, 0, card)
          }
        }
      }
    },
    addComment: (state, action: PayloadAction<Comment>) => {
      if (state.currentBoard) {
        state.currentBoard.lists.forEach(list => {
          const card = list.cards.find(c => c._id === action.payload.cardId)
          if (card) {
            card.comments.push(action.payload)
          }
        })
      }
    },
    setConnectedUsers: (state, action: PayloadAction<string[]>) => {
      state.connectedUsers = action.payload
    },
    addConnectedUser: (state, action: PayloadAction<string>) => {
      if (!state.connectedUsers.includes(action.payload)) {
        state.connectedUsers.push(action.payload)
      }
    },
    removeConnectedUser: (state, action: PayloadAction<string>) => {
      state.connectedUsers = state.connectedUsers.filter(id => id !== action.payload)
    },
  },
})

export const {
  setLoading,
  setBoards,
  setCurrentBoard,
  addBoard,
  updateBoard,
  deleteBoard,
  addList,
  updateList,
  deleteList,
  reorderLists,
  addCard,
  updateCard,
  deleteCard,
  moveCard,
  addComment,
  setConnectedUsers,
  addConnectedUser,
  removeConnectedUser,
} = boardSlice.actions

export default boardSlice.reducer