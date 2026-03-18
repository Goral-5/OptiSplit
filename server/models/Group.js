import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ name: 'text' });
groupSchema.index({ slug: 1 });

// Generate slug before saving
groupSchema.pre('save', function (next) {
  if (this.isModified('name') && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

// Prevent duplicate members
groupSchema.pre('save', function (next) {
  const memberIds = this.members.map((m) => m.userId.toString());
  const uniqueMemberIds = [...new Set(memberIds)];
  
  if (memberIds.length !== uniqueMemberIds.length) {
    // Remove duplicates
    const seen = new Set();
    this.members = this.members.filter((member) => {
      const id = member.userId.toString();
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }
  
  // Update memberCount
  this.memberCount = this.members.length;
  
  next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
