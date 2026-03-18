import mongoose from 'mongoose';

const personalExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      default: 'Other',
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
personalExpenseSchema.index({ userId: 1, date: -1 });
personalExpenseSchema.index({ userId: 1, category: 1, date: -1 });

const PersonalExpense = mongoose.model('PersonalExpense', personalExpenseSchema);

export default PersonalExpense;
