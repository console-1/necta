import { z } from 'zod'

// Password validation schema with security requirements
export const PasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
  .refine(
    (password) => !isCommonPassword(password),
    'Password is too common, please choose a stronger password'
  )

// Email validation schema
export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .max(320, 'Email address too long') // RFC 5321 limit
  .toLowerCase()
  .refine(
    (email) => !isDisposableEmail(email),
    'Disposable email addresses are not allowed'
  )

// Username validation schema
export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(
    (username) => !isReservedUsername(username),
    'This username is reserved'
  )

// JWT token schema
export const JWTTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, 'Invalid JWT token format')

// MFA code schema
export const MFACodeSchema = z
  .string()
  .length(6, 'MFA code must be exactly 6 digits')
  .regex(/^\d{6}$/, 'MFA code must contain only numbers')

// Registration schema
export const RegisterSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  confirm_password: z.string(),
}).refine(
  (data) => data.password === data.confirm_password,
  {
    message: "Passwords don't match",
    path: ["confirm_password"],
  }
)

// Login schema
export const LoginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or username is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false),
})

// Password reset request schema
export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
})

// Password reset schema
export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: PasswordSchema,
  confirm_password: z.string(),
}).refine(
  (data) => data.password === data.confirm_password,
  {
    message: "Passwords don't match",
    path: ["confirm_password"],
  }
)

// Change password schema
export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: PasswordSchema,
  confirm_password: z.string(),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: "Passwords don't match",
    path: ["confirm_password"],
  }
).refine(
  (data) => data.current_password !== data.new_password,
  {
    message: "New password must be different from current password",
    path: ["new_password"],
  }
)

// MFA setup schema
export const MFASetupSchema = z.object({
  secret: z.string().min(1, 'MFA secret is required'),
  code: MFACodeSchema,
})

// MFA verification schema
export const MFAVerificationSchema = z.object({
  code: MFACodeSchema,
})

// User profile update schema
export const UserProfileUpdateSchema = z.object({
  username: UsernameSchema.optional(),
  email: EmailSchema.optional(),
  first_name: z
    .string()
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name')
    .optional(),
  last_name: z
    .string()
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name')
    .optional(),
})

// Export types
export type Register = z.infer<typeof RegisterSchema>
export type Login = z.infer<typeof LoginSchema>
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>
export type PasswordReset = z.infer<typeof PasswordResetSchema>
export type ChangePassword = z.infer<typeof ChangePasswordSchema>
export type MFASetup = z.infer<typeof MFASetupSchema>
export type MFAVerification = z.infer<typeof MFAVerificationSchema>
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>

// Validation functions with security checks
export function validateRegistration(data: unknown): Register {
  const result = RegisterSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error(`Registration validation failed: ${result.error.message}`)
  }
  
  return result.data
}

export function validateLogin(data: unknown): Login {
  const result = LoginSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error(`Login validation failed: ${result.error.message}`)
  }
  
  // Additional security checks
  const login = result.data
  
  // Prevent timing attacks on identifier field
  if (login.identifier.length > 100) {
    throw new Error('Identifier too long')
  }
  
  return login
}

// Security helper functions
function isCommonPassword(password: string): boolean {
  // List of common passwords to reject
  const commonPasswords = [
    'password123',
    '123456789012',
    'qwertyuiop12',
    'administrator',
    'passwordpassword',
    'welcome123456',
    'letmein12345',
    'admin1234567',
  ]
  
  return commonPasswords.includes(password.toLowerCase())
}

function isDisposableEmail(email: string): boolean {
  // List of known disposable email domains
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    'throwaway.email',
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  return disposableDomains.includes(domain)
}

function isReservedUsername(username: string): boolean {
  // List of reserved usernames
  const reserved = [
    'admin',
    'administrator',
    'root',
    'system',
    'api',
    'www',
    'ftp',
    'mail',
    'support',
    'help',
    'info',
    'test',
    'demo',
    'guest',
    'necta',
    'n8n',
  ]
  
  return reserved.includes(username.toLowerCase())
}