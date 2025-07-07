import { z } from 'zod'

// Environment validation
export const EnvironmentSchema = z.enum(['dev', 'prod'])
export type Environment = z.infer<typeof EnvironmentSchema>

// Webhook authentication types
export const WebhookAuthTypeSchema = z.enum(['none', 'basic', 'header', 'jwt'])
export type WebhookAuthType = z.infer<typeof WebhookAuthTypeSchema>

// Webhook authentication configurations
export const WebhookAuthConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('none'),
  }),
  z.object({
    type: z.literal('basic'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
  z.object({
    type: z.literal('header'),
    key: z.string().min(1, 'Header key is required'),
    value: z.string().min(1, 'Header value is required'),
  }),
  z.object({
    type: z.literal('jwt'),
    token: z.string().min(1, 'JWT token is required'),
    secret: z.string().optional(),
  }),
])
export type WebhookAuthConfig = z.infer<typeof WebhookAuthConfigSchema>

// Base profile validation schema
export const BaseProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Profile name is required')
    .max(100, 'Profile name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Profile name contains invalid characters'),
  
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  dev_webhook_url: z
    .string()
    .url('Invalid development webhook URL')
    .refine(
      (url) => url.startsWith('https://') || url.includes('localhost'),
      'Webhook URL must use HTTPS or be localhost'
    ),
  
  prod_webhook_url: z
    .string()
    .url('Invalid production webhook URL')
    .refine(
      (url) => url.startsWith('https://'),
      'Production webhook URL must use HTTPS'
    ),
  
  webhook_auth_type: WebhookAuthTypeSchema,
  webhook_auth_config: WebhookAuthConfigSchema,
  
  langsmith_api_key: z
    .string()
    .optional()
    .refine(
      (key) => !key || key.length >= 10,
      'LangSmith API key must be at least 10 characters'
    ),
  
  environment: EnvironmentSchema.default('dev'),
  is_active: z.boolean().default(true),
})

// Create profile schema (without ID)
export const CreateProfileSchema = BaseProfileSchema

// Update profile schema (partial, with ID)
export const UpdateProfileSchema = BaseProfileSchema.partial().extend({
  id: z.string().uuid('Invalid profile ID'),
})

// Full profile schema (with system fields)
export const ProfileSchema = BaseProfileSchema.extend({
  id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
})

// Profile response schema (safe for API responses)
export const ProfileResponseSchema = ProfileSchema.omit({
  webhook_auth_config: true,
  langsmith_api_key: true,
}).extend({
  webhook_auth_type: WebhookAuthTypeSchema,
  has_langsmith_key: z.boolean(),
})

// Export types
export type BaseProfile = z.infer<typeof BaseProfileSchema>
export type CreateProfile = z.infer<typeof CreateProfileSchema>
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>

// Validation functions with security checks
export function validateProfileCreation(data: unknown): CreateProfile {
  const result = CreateProfileSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error(`Profile validation failed: ${result.error.message}`)
  }
  
  // Additional security validations
  const profile = result.data
  
  // Prevent webhook URL conflicts
  if (profile.dev_webhook_url === profile.prod_webhook_url) {
    throw new Error('Development and production webhook URLs must be different')
  }
  
  // Validate webhook URL hosts (prevent SSRF)
  const devUrl = new URL(profile.dev_webhook_url)
  const prodUrl = new URL(profile.prod_webhook_url)
  
  // Block private IP ranges in production webhooks
  if (isPrivateIP(prodUrl.hostname)) {
    throw new Error('Production webhook URLs cannot use private IP addresses')
  }
  
  return profile
}

export function validateProfileUpdate(data: unknown): UpdateProfile {
  const result = UpdateProfileSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error(`Profile update validation failed: ${result.error.message}`)
  }
  
  return result.data
}

// Helper function to detect private IP addresses
function isPrivateIP(hostname: string): boolean {
  // Basic private IP detection (extend as needed)
  const privateRanges = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^::1$/,
    /^fe80:/i,
  ]
  
  return privateRanges.some(range => range.test(hostname))
}