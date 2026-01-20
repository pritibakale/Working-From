import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkSchedule {
  days: {
    0: string | null;
    1: string | null;
    2: string | null;
    3: string | null;
    4: string | null;
    5: string | null;
    6: string | null;
  };
  alternateReferenceDate: string;
}

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  googleId: string;
  totalPaidLeaves: number;
  weeklyEmailEnabled: boolean;
  workSchedule?: IWorkSchedule;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    image: {
      type: String,
    },
    googleId: {
      type: String,
      required: [true, 'Google ID is required'],
      unique: true,
    },
    totalPaidLeaves: {
      type: Number,
      default: 0,
    },
    weeklyEmailEnabled: {
      type: Boolean,
      default: false,
    },
    workSchedule: {
      type: {
        days: {
          0: { type: String, default: null },
          1: { type: String, default: 'office' },
          2: { type: String, default: 'office' },
          3: { type: String, default: 'home' },
          4: { type: String, default: 'home' },
          5: { type: String, default: 'alternate' },
          6: { type: String, default: null },
        },
        alternateReferenceDate: { type: String, default: '2026-01-23' },
      },
      default: {
        days: {
          0: null,
          1: 'office',
          2: 'office',
          3: 'home',
          4: 'home',
          5: 'alternate',
          6: null,
        },
        alternateReferenceDate: '2026-01-23',
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
