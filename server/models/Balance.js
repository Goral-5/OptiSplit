import mongoose from "mongoose";

const balanceSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    index: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  owesTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  amount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }

}, { timestamps: true });

// indexes for faster queries
balanceSchema.index({ groupId: 1, user: 1, owesTo: 1 });
balanceSchema.index({ user: 1, owesTo: 1 });

// prevent negative balances
balanceSchema.pre('save', function(next) {
  if (this.amount < 0) {
    this.amount = 0;
  }
  next();
});

export default mongoose.model("Balance", balanceSchema);
