import mongoose, { Document, Schema } from 'mongoose'

export interface IComment extends Document {
  content: string
  cardId: mongoose.Types.ObjectId
  author: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  cardId: {
    type: Schema.Types.ObjectId,
    ref: 'Card',
    required: [true, 'Card ID is required']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  }
}, {
  timestamps: true
})

// Indexes for better query performance
commentSchema.index({ cardId: 1, createdAt: -1 })

export const Comment = mongoose.model<IComment>('Comment', commentSchema)