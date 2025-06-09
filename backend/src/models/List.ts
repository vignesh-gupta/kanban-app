import mongoose, { Document, Schema } from 'mongoose'

export interface IList extends Document {
  title: string
  boardId: mongoose.Types.ObjectId
  position: number
  createdAt: Date
  updatedAt: Date
}

const listSchema = new Schema<IList>({
  title: {
    type: String,
    required: [true, 'List title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
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
  }
}, {
  timestamps: true
})

// Indexes for better query performance
listSchema.index({ boardId: 1, position: 1 })

export const List = mongoose.model<IList>('List', listSchema)