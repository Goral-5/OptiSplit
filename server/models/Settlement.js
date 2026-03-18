import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paidByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receivedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
    },
    relatedExpenseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
settlementSchema.index({ groupId: 1, date: -1 });
settlementSchema.index({ paidByUserId: 1, groupId: 1 });
settlementSchema.index({ receivedByUserId: 1, groupId: 1 });

// Validation
settlementSchema.pre('save', function (next) {
  if (this.paidByUserId.toString() === this.receivedByUserId.toString()) {
    throw new Error('Payer and receiver cannot be the same user');
  }
  
  if (this.amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  next();
});

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;
