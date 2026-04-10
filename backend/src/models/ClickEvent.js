import mongoose from 'mongoose';

/** Per-click record for analytics (timestamps, optional IP). */
const clickEventSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    clickedAt: { type: Date, default: Date.now, index: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: false }
);

clickEventSchema.index({ urlId: 1, clickedAt: -1 });

export const ClickEvent = mongoose.model('ClickEvent', clickEventSchema);
