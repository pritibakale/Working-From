import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  userId: string;
  name: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique date per user
HolidaySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
