import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  isDarkMode: boolean
  sidebarOpen: boolean
  activeCard: string | null
  draggedCard: string | null
}

const initialState: UiState = {
  isDarkMode: localStorage.getItem('theme') === 'dark',
  sidebarOpen: true,
  activeCard: null,
  draggedCard: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode
      localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light')
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setActiveCard: (state, action: PayloadAction<string | null>) => {
      state.activeCard = action.payload
    },
    setDraggedCard: (state, action: PayloadAction<string | null>) => {
      state.draggedCard = action.payload
    },
  },
})

export const { toggleDarkMode, toggleSidebar, setActiveCard, setDraggedCard } = uiSlice.actions
export default uiSlice.reducer