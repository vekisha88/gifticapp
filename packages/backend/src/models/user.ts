import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { logger } from '../logger.js';

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  preferences: IUserPreferences;
  createdAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(this: IUser, next) {
  try {
    // Only hash the password if it's modified or new
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    logger.error(`Error hashing password: ${error.message}`);
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error: any) {
    logger.error(`Error comparing passwords: ${error.message}`);
    throw error;
  }
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function(this: IUser) {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model<IUser>('User', userSchema);

export default User; 

