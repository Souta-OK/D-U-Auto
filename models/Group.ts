import mongoose, { Schema, Document } from 'mongoose';

export interface IChildStore {
  domain: string;
  adminToken: string;
}

export interface IGroup extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  parentStore: {
    domain: string;
    adminToken: string;
  };
  childStores: IChildStore[];
  syncType: 'sync' | 'async';
  isSyncing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChildStoreSchema = new Schema<IChildStore>({
  domain: { type: String, required: true },
  adminToken: { type: String, required: true },
});

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentStore: {
      domain: { type: String, required: true },
      adminToken: { type: String, required: true },
    },
    childStores: [ChildStoreSchema],
    syncType: { type: String, enum: ['sync', 'async'], default: 'async' },
    isSyncing: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);


