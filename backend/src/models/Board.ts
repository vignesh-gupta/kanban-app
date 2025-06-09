import mongoose, { Document, Schema } from 'mongoose'

export interface IBoard extends Document {
  title: string
  description?: string
  color: string
  owner: mongoose.Types.ObjectId
  collaborators: Array<{
    user: mongoose.Types.ObjectId
    role: 'collaborator'
    joinedAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const boardSchema = new Schema<IBoard>({
  title: {
    type: String,
    required: [true, 'Board title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'Board color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Board owner is required']
  },
  collaborators: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['collaborator'],
      default: 'collaborator'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Indexes for better query performance
boardSchema.index({ owner: 1 })
boardSchema.index({ 'collaborators.user': 1 })
boardSchema.index({ title: 'text', description: 'text' })

export const Board = mongoose.model<IBoard>('Board', boardSchema)