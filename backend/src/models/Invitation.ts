import mongoose, { Document, Schema } from 'mongoose'

export interface IInvitation extends Document {
  boardId: mongoose.Types.ObjectId
  email: string
  role: 'collaborator'
  token: string
  status: 'pending' | 'accepted' | 'expired'
  invitedBy: mongoose.Types.ObjectId
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const invitationSchema = new Schema<IInvitation>({
  boardId: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: [true, 'Board ID is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    enum: ['collaborator'],
    default: 'collaborator'
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Invited by is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
})

// Indexes for better query performance
invitationSchema.index({ email: 1, boardId: 1 })
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema)