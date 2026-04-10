import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'apple'],
      default: 'local',
    },
    providerId: {
      type: String,
      default: '',
    },
    passwordHash: {
      type: String,
      required: function requiredPasswordHash() {
        return this.authProvider === 'local';
      },
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ authProvider: 1, providerId: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
