import { z } from 'zod'

// Message types
export const MessageTypeSchema = z.enum(['user', 'agent', 'system'])
export type MessageType = z.infer<typeof MessageTypeSchema>

// Content formats
export const ContentFormatSchema = z.enum(['text', 'markdown', 'html', 'json'])
export type ContentFormat = z.infer<typeof ContentFormatSchema>

// File attachment validation
export const FileAttachmentSchema = z.object({
  id: z.string().uuid(),
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),
  
  size: z
    .number()
    .min(1, 'File size must be greater than 0')
    .max(16 * 1024 * 1024, 'File size cannot exceed 16MB'), // n8n limit
  
  mime_type: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*$/, 'Invalid MIME type'),
  
  url: z.string().url('Invalid file URL'),
  uploaded_at: z.date(),
})
export type FileAttachment = z.infer<typeof FileAttachmentSchema>

// Message metadata schema
export const MessageMetadataSchema = z.object({
  response_time_ms: z.number().optional(),
  token_count: z.number().optional(),
  cost_estimate: z.number().optional(),
  langsmith_trace_id: z.string().optional(),
  webhook_attempts: z.number().optional(),
  error_details: z.string().optional(),
}).catchall(z.unknown()) // Allow additional metadata
export type MessageMetadata = z.infer<typeof MessageMetadataSchema>

// Base message schema
export const BaseMessageSchema = z.object({
  profile_id: z.string().uuid('Invalid profile ID'),
  message_type: MessageTypeSchema,
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(32000, 'Message content too long'), // Reasonable limit
  
  content_format: ContentFormatSchema.default('markdown'),
  metadata: MessageMetadataSchema.optional(),
  file_attachments: z.array(FileAttachmentSchema).default([]),
})

// Create message schema (user input)
export const CreateMessageSchema = BaseMessageSchema.pick({
  content: true,
  content_format: true,
  file_attachments: true,
}).extend({
  profile_id: z.string().uuid('Invalid profile ID'),
})

// Full message schema (with system fields)
export const MessageSchema = BaseMessageSchema.extend({
  id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
})

// Message response schema (safe for API responses)
export const MessageResponseSchema = MessageSchema

// Webhook payload schema
export const WebhookPayloadSchema = z.object({
  message_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  content: z.string(),
  format: ContentFormatSchema,
  timestamp: z.string().datetime(),
  attachments: z.array(z.string()).optional(),
  metadata: z.object({
    profile_id: z.string().uuid(),
    environment: z.enum(['dev', 'prod']),
  }).catchall(z.unknown()),
})

// Export types
export type BaseMessage = z.infer<typeof BaseMessageSchema>
export type CreateMessage = z.infer<typeof CreateMessageSchema>
export type Message = z.infer<typeof MessageSchema>
export type MessageResponse = z.infer<typeof MessageResponseSchema>
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>

// Validation functions with security checks
export function validateMessageCreation(data: unknown): CreateMessage {
  const result = CreateMessageSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error(`Message validation failed: ${result.error.message}`)
  }
  
  const message = result.data
  
  // Content security validation
  if (message.content_format === 'html') {
    validateHTMLContent(message.content)
  }
  
  if (message.content_format === 'json') {
    validateJSONContent(message.content)
  }
  
  // File attachment security validation
  if (message.file_attachments && message.file_attachments.length > 0) {
    validateFileAttachments(message.file_attachments)
  }
  
  return message
}

export function validateWebhookPayload(data: unknown): WebhookPayload {
  const result = WebhookPayloadSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error(`Webhook payload validation failed: ${result.error.message}`)
  }
  
  return result.data
}

// Security validation helpers
function validateHTMLContent(content: string): void {
  // Basic HTML security checks
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      throw new Error('HTML content contains potentially dangerous elements')
    }
  }
}

function validateJSONContent(content: string): void {
  try {
    const parsed = JSON.parse(content)
    
    // Prevent deeply nested objects (DoS protection)
    const maxDepth = 10
    if (getObjectDepth(parsed) > maxDepth) {
      throw new Error('JSON content is too deeply nested')
    }
    
    // Prevent excessively large objects
    if (JSON.stringify(parsed).length > 10000) {
      throw new Error('JSON content is too large')
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON content')
    }
    throw error
  }
}

function validateFileAttachments(attachments: FileAttachment[]): void {
  // Maximum 10 files per message
  if (attachments.length > 10) {
    throw new Error('Too many file attachments (maximum 10)')
  }
  
  // Check total size
  const totalSize = attachments.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > 16 * 1024 * 1024) { // 16MB total
    throw new Error('Total file size exceeds 16MB limit')
  }
  
  // Validate allowed file types
  const allowedMimeTypes = [
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]
  
  for (const file of attachments) {
    if (!allowedMimeTypes.includes(file.mime_type)) {
      throw new Error(`File type not allowed: ${file.mime_type}`)
    }
  }
}

function getObjectDepth(obj: any): number {
  if (typeof obj !== 'object' || obj === null) {
    return 0
  }
  
  let maxDepth = 0
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const depth = getObjectDepth(obj[key])
      maxDepth = Math.max(maxDepth, depth)
    }
  }
  
  return maxDepth + 1
}