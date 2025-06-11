import { Server, Socket } from 'socket.io'
import { Board } from '../models/Board'
import { List } from '../models/List'
import { Card } from '../models/Card'
import { Comment } from '../models/Comment'
import { AuditLog } from '../models/AuditLog'

export const boardSocketHandlers = (io: Server, socket: Socket) => {
  // Join a board room
  socket.on('join-board', async (boardId: string) => {
    try {
      // Verify user has access to board
      const board = await Board.findById(boardId)
      if (!board) return

      const hasAccess = board.owner.equals(socket.user?._id) || 
        board.collaborators.some(collab => collab.user.equals(socket.user?._id))

      if (!hasAccess) return

      // Leave previous room if any
      const rooms = Array.from(socket.rooms)
      rooms.forEach(room => {
        if (room.startsWith('board-')) {
          socket.leave(room)
        }
      })

      // Join new board room
      const roomName = `board-${boardId}`
      socket.join(roomName)
      
      // Notify others in the room
      socket.to(roomName).emit('user.join', {
        userId: socket.user?._id,
        user: {
          id: socket.user?._id,
          name: socket.user?.name,
          email: socket.user?.email,
          avatar: socket.user?.avatar
        }
      })
      
      console.log(`User ${socket.user?.name} joined board ${boardId}`)
    } catch (error) {
      console.error('Error joining board:', error)
    }
  })

  // Leave a board room
  socket.on('leave-board', (boardId: string) => {
    const roomName = `board-${boardId}`
    socket.leave(roomName)
    
    // Notify others in the room
    socket.to(roomName).emit('user.leave', {
      userId: socket.user?._id
    })
    
    console.log(`User ${socket.user?.name} left board ${boardId}`)
  })

  // Board update
  socket.on('board.update', async (data) => {
    try {
      const { boardId, ...updateData } = data
      
      const board = await Board.findByIdAndUpdate(
        boardId,
        updateData,
        { new: true }
      ).populate('owner', 'name email avatar')
       .populate('collaborators.user', 'name email avatar')

      if (board) {
        socket.to(`board-${boardId}`).emit('board.update', board)
        
        await new AuditLog({
          action: 'board_updated',
          user: socket.user?._id,
          board: boardId,
          details: `Updated board "${board.title}"`
        }).save()
      }
    } catch (error) {
      console.error('Error updating board:', error)
    }
  })

  // List operations
  socket.on('list.create', async (data) => {
    try {
      const list = new List({
        ...data,
        boardId: data.boardId
      })
      
      await list.save()
      
      const roomName = `board-${data.boardId}`
      io.to(roomName).emit('list.create', {
        ...list.toObject(),
        cards: []
      })

      await new AuditLog({
        action: 'list_created',
        user: socket.user?._id,
        board: data.boardId,
        details: `Created list "${list.title}"`
      }).save()
    } catch (error) {
      console.error('Error creating list:', error)
    }
  })

  socket.on('list.update', async (data) => {
    try {
      const list = await List.findByIdAndUpdate(
        data._id,
        data,
        { new: true }
      )
      
      if (list) {
        const roomName = `board-${list.boardId}`
        socket.to(roomName).emit('list.update', list)

        await new AuditLog({
          action: 'list_updated',
          user: socket.user?._id,
          board: list.boardId,
          details: `Updated list "${list.title}"`
        }).save()
      }
    } catch (error) {
      console.error('Error updating list:', error)
    }
  })

  socket.on('list.delete', async (data) => {
    try {
      const { listId } = data
      const list = await List.findById(listId)
      
      if (list) {
        // Delete all cards in the list
        await Card.deleteMany({ listId })
        await List.findByIdAndDelete(listId)
        
        const roomName = `board-${list.boardId}`
        io.to(roomName).emit('list.delete', { listId })

        await new AuditLog({
          action: 'list_deleted',
          user: socket.user?._id,
          board: list.boardId,
          details: `Deleted list "${list.title}"`
        }).save()
      }
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  })

  // Card operations
  socket.on('card.create', async (data) => {
    try {
      const card = new Card({
        ...data,
        createdBy: socket.user?._id
      })
      
      await card.save()
      await card.populate([
        { path: 'assignee', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' }
      ])
      
      const roomName = `board-${data.boardId}`
      io.to(roomName).emit('card.create', {
        ...card.toObject(),
        comments: []
      })

      await new AuditLog({
        action: 'card_created',
        user: socket.user?._id,
        board: data.boardId,
        details: `Created card "${card.title}"`
      }).save()
    } catch (error) {
      console.error('Error creating card:', error)
    }
  })

  socket.on('card.update', async (data) => {
    try {
      const card = await Card.findByIdAndUpdate(
        data._id,
        data,
        { new: true }
      ).populate([
        { path: 'assignee', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' }
      ])
      
      if (card) {
        const roomName = `board-${card.boardId}`
        socket.to(roomName).emit('card.update', card)

        await new AuditLog({
          action: 'card_updated',
          user: socket.user?._id,
          board: card.boardId,
          details: `Updated card "${card.title}"`
        }).save()
      }
    } catch (error) {
      console.error('Error updating card:', error)
    }
  })

  socket.on('card.delete', async (data) => {
    try {
      const { cardId } = data
      const card = await Card.findById(cardId)
      
      if (card) {
        // Delete all comments for the card
        await Comment.deleteMany({ cardId })
        await Card.findByIdAndDelete(cardId)
        
        const roomName = `board-${card.boardId}`
        io.to(roomName).emit('card.delete', { cardId })

        await new AuditLog({
          action: 'card_deleted',
          user: socket.user?._id,
          board: card.boardId,
          details: `Deleted card "${card.title}"`
        }).save()
      }
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  })

  socket.on('card.move', async (data) => {
    try {
      const { cardId, toListId, position } = data
      
      const card = await Card.findByIdAndUpdate(
        cardId,
        { listId: toListId, position },
        { new: true }
      ).populate([
        { path: 'assignee', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' }
      ])
      
      if (card) {
        const roomName = `board-${card.boardId}`
        socket.to(roomName).emit('card.move', {
          cardId,
          fromListId: data.fromListId,
          toListId,
          position
        })

        await new AuditLog({
          action: 'card_moved',
          user: socket.user?._id,
          board: card.boardId,
          details: `Moved card "${card.title}"`
        }).save()
      }
    } catch (error) {
      console.error('Error moving card:', error)
    }
  })

  // Comment operations
  socket.on('comment.create', async (data) => {
    try {
      const comment = new Comment({
        ...data,
        author: socket.user?._id
      })
      
      await comment.save()
      await comment.populate('author', 'name email avatar')
      
      // Get the card to find the board
      const card = await Card.findById(data.cardId)
      if (card) {
        const roomName = `board-${card.boardId}`
        io.to(roomName).emit('comment.create', comment)

        await new AuditLog({
          action: 'comment_added',
          user: socket.user?._id,
          board: card.boardId,
          details: `Added comment to card "${card.title}"`
        }).save()
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    }
  })
}