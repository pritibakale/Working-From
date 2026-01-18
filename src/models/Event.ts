import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  type: 'event' | 'paid-leave';
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      default: '#3b82f6',
    },
    type: {
      type: String,
      enum: ['event', 'paid-leave'],
      default: 'event',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
