import mongoose, { Document, Schema } from 'mongoose'

export interface IAuditLog extends Document {
  action: string
  user: mongoose.Types.ObjectId
  board: mongoose.Types.ObjectId
  details: string
  timestamp: Date
}

const auditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    maxlength: [100, 'Action cannot exceed 100 characters']
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: [true, 'Board is required']
  },
  details: {
    type: String,
    required: [true, 'Details are required'],
    trim: true,
    maxlength: [500, 'Details cannot exceed 500 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We're using our own timestamp field
})

// Indexes for better query performance
auditLogSchema.index({ board: 1, timestamp: -1 })
auditLogSchema.index({ user: 1, timestamp: -1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema)