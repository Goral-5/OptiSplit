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

export default mongoose.model("Balance", balanceSchema);
