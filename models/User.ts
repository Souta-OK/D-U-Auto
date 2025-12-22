import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  image?: string;
  provider: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword?(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    name: { type: String, trim: true },
    image: { type: String },
    provider: { type: String, required: true }, // 'google', 'github', etc.
    providerId: { type: String, required: true }, // OAuth provider user ID
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only if password exists and is modified)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password (only for users with passwords)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);




