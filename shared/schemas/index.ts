// Central export for all validation schemas
export * from './auth'
export * from './message'
export * from './profile'

// Common validation utilities
import { z } from 'zod'

// Environment variable validation
export const EnvironmentVariablesSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Security
  SECRET_KEY: z.string().min(32, 'Secret key must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // External services
  LANGSMITH_API_KEY: z.string().optional(),
  N8N_BASE_URL: z.string().url('Invalid n8n base URL').optional(),
  
  // Application settings
  SESSION_TIMEOUT_MINUTES: z.coerce.number().min(1).max(60).default(10),
  PASSWORD_MIN_LENGTH: z.coerce.number().min(8).max(50).default(12),
  
  // File upload
  MAX_FILE_SIZE_MB: z.coerce.number().min(1).max(100).default(16),
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Webhook settings
  WEBHOOK_TIMEOUT: z.coerce.number().min(1).max(300).default(30),
  WEBHOOK_MAX_RETRIES: z.coerce.number().min(0).max(10).default(3),
  WEBHOOK_RETRY_DELAY_SECONDS: z.coerce.number().min(1).max(60).default(5),
  
  // Feature flags
  FEATURE_MFA_ENABLED: z.coerce.boolean().default(true),
  FEATURE_FILE_UPLOAD_ENABLED: z.coerce.boolean().default(true),
  FEATURE_EXPORT_ENABLED: z.coerce.boolean().default(true),
  FEATURE_SEARCH_ENABLED: z.coerce.boolean().default(true),
})

export type EnvironmentVariables = z.infer<typeof EnvironmentVariablesSchema>

// Generic API response schemas
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  request_id: z.string().uuid().optional(),
})

export const ApiSuccessSchema = z.object({
  success: z.boolean().default(true),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
})

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total_pages: z.number(),
    total_items: z.number(),
    has_next: z.boolean(),
    has_prev: z.boolean(),
  }),
})

// Export types
export type ApiError = z.infer<typeof ApiErrorSchema>
export type ApiSuccess = z.infer<typeof ApiSuccessSchema>
export type Pagination = z.infer<typeof PaginationSchema>
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>

// Validation helper functions
export function validateEnvironmentVariables(env: Record<string, string | undefined>): EnvironmentVariables {
  const result = EnvironmentVariablesSchema.safeParse(env)
  
  if (!result.success) {
    throw new Error(`Environment validation failed: ${result.error.message}`)
  }
  
  return result.data
}

export function createApiError(error: string, message: string, details?: Record<string, any>): ApiError {
  return {
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
  }
}

export function createApiSuccess<T>(data: T, message?: string): ApiSuccess {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

// Security validation utilities
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }
  
  // Remove null bytes and control characters
  const sanitized = input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
  
  if (sanitized.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} characters)`)
  }
  
  return sanitized
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function validateURL(url: string, allowedProtocols: string[] = ['https']): boolean {
  try {
    const parsedUrl = new URL(url)
    return allowedProtocols.includes(parsedUrl.protocol.slice(0, -1))
  } catch {
    return false
  }
}

// Rate limiting helpers
export function createRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`
}

export function isRateLimited(attempts: number, maxAttempts: number, windowMs: number, lastAttempt: Date): boolean {
  const now = new Date()
  const timeDiff = now.getTime() - lastAttempt.getTime()
  
  // Reset if window has passed
  if (timeDiff > windowMs) {
    return false
  }
  
  return attempts >= maxAttempts
}