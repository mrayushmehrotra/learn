import { Schema, model, Document, Types } from 'mongoose';
import crypto from 'crypto';
import { config } from '../../config/index.js';

export interface IConnectedRepo {
    repoId: number;
    fullName: string;
    webhookId?: number;
    isActive: boolean;
    connectedAt: Date;
}

export interface IUserSettings {
    autoReview: boolean;
    reviewOnDraft: boolean;
    notifyOnComplete: boolean;
}

export interface IUser {
    _id: Types.ObjectId;
    githubId: number;
    username: string;
    email: string;
    avatarUrl: string;
    accessToken: string;
    refreshToken?: string;
    connectedRepos: IConnectedRepo[];
    settings: IUserSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
    decryptToken(): string;
}

const connectedRepoSchema = new Schema<IConnectedRepo>(
    {
        repoId: { type: Number, required: true },
        fullName: { type: String, required: true },
        webhookId: { type: Number },
        isActive: { type: Boolean, default: true },
        connectedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const userSettingsSchema = new Schema<IUserSettings>(
    {
        autoReview: { type: Boolean, default: true },
        reviewOnDraft: { type: Boolean, default: false },
        notifyOnComplete: { type: Boolean, default: true },
    },
    { _id: false }
);

const userSchema = new Schema<IUserDocument>(
    {
        githubId: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },
        username: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        avatarUrl: {
            type: String,
            default: '',
        },
        accessToken: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
        },
        connectedRepos: {
            type: [connectedRepoSchema],
            default: [],
        },
        settings: {
            type: userSettingsSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: Record<string, unknown>) => {
                delete ret.accessToken;
                delete ret.refreshToken;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Encrypt token before saving
userSchema.pre('save', function (next) {
    if (this.isModified('accessToken')) {
        this.accessToken = encryptToken(this.accessToken);
    }
    if (this.isModified('refreshToken') && this.refreshToken) {
        this.refreshToken = encryptToken(this.refreshToken);
    }
    next();
});

// Method to decrypt token
userSchema.methods.decryptToken = function (): string {
    return decryptToken(this.accessToken);
};

// Encryption helpers
function encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(config.ENCRYPTION_KEY, 'utf-8').subarray(0, 32);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedToken.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
    }

    const iv = Buffer.from(parts[0]!, 'hex');
    const authTag = Buffer.from(parts[1]!, 'hex');
    const encrypted = parts[2]!;
    const key = Buffer.from(config.ENCRYPTION_KEY, 'utf-8').subarray(0, 32);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export const User = model<IUserDocument>('User', userSchema);
