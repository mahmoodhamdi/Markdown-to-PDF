/**
 * SSO Models
 * Stores SSO configurations, domain mappings, and audit logs
 */

import mongoose, { Schema, Model, Types } from 'mongoose';

export type SSOProvider = 'saml' | 'oidc' | 'azure_ad' | 'okta' | 'google_workspace';
export type SSOStatus = 'active' | 'inactive' | 'pending' | 'error';

// SSO Configuration Model
export interface ISSOConfiguration {
  _id: Types.ObjectId;
  organizationId: string;
  provider: SSOProvider;
  status: SSOStatus;
  config: Record<string, unknown>;
  domain: string;
  enforceSSO: boolean;
  allowBypass: boolean;
  jitProvisioning: boolean;
  defaultRole: 'member' | 'admin';
  lastTestedAt?: Date;
  testResult?: {
    success: boolean;
    error?: string;
    testedBy?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SSOConfigurationSchema = new Schema<ISSOConfiguration>(
  {
    organizationId: { type: String, required: true, index: true },
    provider: {
      type: String,
      enum: ['saml', 'oidc', 'azure_ad', 'okta', 'google_workspace'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'error'],
      default: 'pending',
    },
    config: { type: Schema.Types.Mixed, required: true },
    domain: { type: String, required: true, lowercase: true },
    enforceSSO: { type: Boolean, default: false },
    allowBypass: { type: Boolean, default: true },
    jitProvisioning: { type: Boolean, default: true },
    defaultRole: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member',
    },
    lastTestedAt: { type: Date },
    testResult: {
      success: { type: Boolean },
      error: { type: String },
      testedBy: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SSOConfigurationSchema.index({ domain: 1, status: 1 });

export const SSOConfiguration: Model<ISSOConfiguration> =
  mongoose.models.SSOConfiguration ||
  mongoose.model<ISSOConfiguration>('SSOConfiguration', SSOConfigurationSchema);

// SSO Domain Mapping Model
export interface ISSODomainMapping {
  _id: Types.ObjectId;
  domain: string;
  organizationId: string;
  ssoConfigId: string;
  verified: boolean;
  verificationToken?: string;
  verificationMethod?: 'dns' | 'email';
  createdAt: Date;
}

const SSODomainMappingSchema = new Schema<ISSODomainMapping>(
  {
    domain: { type: String, required: true, unique: true, lowercase: true },
    organizationId: { type: String, required: true },
    ssoConfigId: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationMethod: {
      type: String,
      enum: ['dns', 'email'],
      default: 'dns',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SSODomainMappingSchema.index({ ssoConfigId: 1 });

export const SSODomainMapping: Model<ISSODomainMapping> =
  mongoose.models.SSODomainMapping ||
  mongoose.model<ISSODomainMapping>('SSODomainMapping', SSODomainMappingSchema);

// SSO Audit Log Model
export type SSOAuditAction =
  | 'login'
  | 'logout'
  | 'config_created'
  | 'config_updated'
  | 'config_deleted'
  | 'test_success'
  | 'test_failure';

export interface ISSOAuditLog {
  _id: Types.ObjectId;
  organizationId: string;
  action: SSOAuditAction;
  userId?: string;
  userEmail?: string;
  ssoConfigId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const SSOAuditLogSchema = new Schema<ISSOAuditLog>(
  {
    organizationId: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: [
        'login',
        'logout',
        'config_created',
        'config_updated',
        'config_deleted',
        'test_success',
        'test_failure',
      ],
      required: true,
    },
    userId: { type: String },
    userEmail: { type: String },
    ssoConfigId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Indexes
SSOAuditLogSchema.index({ organizationId: 1, timestamp: -1 });

export const SSOAuditLog: Model<ISSOAuditLog> =
  mongoose.models.SSOAuditLog || mongoose.model<ISSOAuditLog>('SSOAuditLog', SSOAuditLogSchema);
