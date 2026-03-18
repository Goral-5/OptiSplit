import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
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
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // NEW: Support multiple payers (future-proof)
    paidBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
    // Keep legacy paidByUserId for backward compatibility
    paidByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    splitType: {
      type: String,
      enum: ['equal', 'percentage', 'exact', 'shares'],
      required: function() {
        return !!this.groupId;
      },
    },
    // Renamed from 'splits' for clarity, keep splits for backward compatibility
    splitBetween: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        share: {
          type: Number,
          default: 1,
          min: 0,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paid: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Legacy splits array (alias to splitBetween)
    splits: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paid: {
          type: Boolean,
          default: false,
        },
      },
    ],
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // NEW: Store final debt graph for audit trail
    transactions: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // NEW: Store split metadata for percentages/shares
    splitMetadata: {
      percentages: {
        type: Map,
        of: Number,
        default: {},
      },
      shares: {
        type: Map,
        of: Number,
        default: {},
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ paidByUserId: 1, groupId: 1 });
expenseSchema.index({ 'splits.userId': 1 });
expenseSchema.index({ 'splitBetween.userId': 1 });
expenseSchema.index({ 'paidBy.userId': 1 });
expenseSchema.index({ 'transactions.from': 1 });
expenseSchema.index({ 'transactions.to': 1 });

// Validation to ensure splits add up to total amount
expenseSchema.pre('save', function (next) {
  const tolerance = 0.01;
  
  // Validate splitBetween if it exists
  if (this.splitBetween && this.splitBetween.length > 0) {
    const totalSplitAmount = this.splitBetween.reduce((sum, split) => sum + split.amount, 0);
    
    if (Math.abs(totalSplitAmount - this.amount) > tolerance) {
      throw new Error(`Split amounts must add up to the total expense amount. Split total: ₹${totalSplitAmount.toFixed(2)}, Expense: ₹${this.amount.toFixed(2)}`);
    }
  }
  
  // Validate splits (legacy) if splitBetween doesn't exist
  if (!this.splitBetween || this.splitBetween.length === 0) {
    const totalSplitAmount = this.splits.reduce((sum, split) => sum + split.amount, 0);
    
    if (Math.abs(totalSplitAmount - this.amount) > tolerance) {
      throw new Error('Split amounts must add up to the total expense amount');
    }
  }
  
  // Validate paidBy amounts if multiple payers
  if (this.paidBy && this.paidBy.length > 1) {
    const totalPaid = this.paidBy.reduce((sum, payer) => sum + payer.amount, 0);
    
    if (Math.abs(totalPaid - this.amount) > tolerance) {
      throw new Error(`Total paid amounts must equal expense total. Paid: ₹${totalPaid.toFixed(2)}, Expense: ₹${this.amount.toFixed(2)}`);
    }
  }
  
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
