import mongoose, { Document, Schema } from 'mongoose'

export interface ICard extends Document {
  title: string
  description?: string
  listId: mongoose.Types.ObjectId
  boardId: mongoose.Types.ObjectId
  position: number
  labels: Array<{
    id: string
    name: string
    color: string
  }>
  assignee: mongoose.Types.ObjectId
  dueDate?: Date
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const cardSchema = new Schema<ICard>({
  title: {
    type: String,
    required: [true, 'Card title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    trim: true
  },
  listId: {
    type: Schema.Types.ObjectId,
    ref: 'List',
    required: [true, 'List ID is required']
  },
  boardId: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: [true, 'Board ID is required']
  },
  position: {
    type: Number,
    required: [true, 'Position is required'],
    min: [0, 'Position cannot be negative']
  },
  labels: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      maxlength: [50, 'Label name cannot exceed 50 characters']
    },
    color: {
      type: String,
      required: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
    }
  }],
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true
})

// Indexes for better query performance
cardSchema.index({ listId: 1, position: 1 })
cardSchema.index({ boardId: 1 })
cardSchema.index({ assignee: 1 })
cardSchema.index({ title: 'text', description: 'text' })

export const Card = mongoose.model<ICard>('Card', cardSchema)