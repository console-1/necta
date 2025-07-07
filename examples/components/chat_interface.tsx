/**
 * NECTA Chat Interface Component
 * 
 * React component for real-time chat with n8n agents using shadcn/ui.
 * Features n8n-inspired design with dotted canvas background.
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Paperclip, Settings, MoreVertical, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Types
interface ChatMessage {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  format: 'markdown' | 'html' | 'json' | 'text'
  timestamp: Date
  attachments?: FileAttachment[]
  metadata?: Record<string, any>
}

interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

interface Profile {
  id: string
  name: string
  description?: string
  environment: 'dev' | 'prod'
  isActive: boolean
}

interface ChatInterfaceProps {
  profile: Profile
  onSendMessage: (content: string, attachments?: File[]) => void
  onProfileSwitch: (profileId: string) => void
  onEnvironmentToggle: (environment: 'dev' | 'prod') => void
  className?: string
}

// TextShimmer component for loading states
const TextShimmer: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}

// Message component with format support
const MessageBubble: React.FC<{ 
  message: ChatMessage
  isUser: boolean
}> = ({ message, isUser }) => {
  const renderContent = () => {
    switch (message.format) {
      case 'markdown':
        // In a real implementation, use a markdown renderer like react-markdown
        return <div className="prose prose-sm max-w-none">{message.content}</div>
      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: message.content }} />
      case 'json':
        return (
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(JSON.parse(message.content), null, 2)}
          </pre>
        )
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>
    }
  }

  return (
    <div className={cn(
      "flex gap-2 max-w-[80%]",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={cn(
          "text-xs",
          isUser ? "bg-blue-500 text-white" : "bg-orange-500 text-white"
        )}>
          {isUser ? "U" : "AI"}
        </AvatarFallback>
      </Avatar>
      
      <Card className={cn(
        "border-0 shadow-sm",
        isUser ? "bg-blue-500 text-white" : "bg-white border border-gray-200"
      )}>
        <CardContent className="p-3">
          {renderContent()}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((file) => (
                <Badge key={file.id} variant="secondary" className="text-xs">
                  <Paperclip className="w-3 h-3 mr-1" />
                  {file.name}
                </Badge>
              ))}
            </div>
          )}
          
          <div className={cn(
            "text-xs mt-2 opacity-70",
            isUser ? "text-blue-100" : "text-gray-500"
          )}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// File upload component
const FileUpload: React.FC<{
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}> = ({ onFilesSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        className="text-gray-500 hover:text-gray-700"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
    </>
  )
}

// Main chat interface component
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  profile,
  onSendMessage,
  onProfileSwitch,
  onEnvironmentToggle,
  className
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() && attachments.length === 0) return

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      format: 'text',
      timestamp: new Date(),
      attachments: attachments.map(file => ({
        id: `file-${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }))
    }

    setMessages(prev => [...prev, newMessage])
    onSendMessage(inputValue.trim(), attachments)
    
    setInputValue('')
    setAttachments([])
    setIsTyping(true)
    
    // Simulate agent response delay
    setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }, [inputValue, attachments, onSendMessage])

  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  // Handle file attachments
  const handleFilesSelected = (files: File[]) => {
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-gradient-to-br from-orange-50 to-gray-50",
      // n8n-inspired dotted background
      "bg-[radial-gradient(circle_at_1px_1px,rgba(139,69,19,0.15)_1px,transparent_0)] bg-[length:20px_20px]",
      className
    )}>
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 shadow-sm">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-orange-500 text-white font-semibold">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={profile.environment === 'prod' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {profile.environment.toUpperCase()}
                  </Badge>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  )} />
                  <span className="text-xs text-gray-500 capitalize">
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onEnvironmentToggle(profile.environment === 'dev' ? 'prod' : 'dev')}
                >
                  Switch to {profile.environment === 'dev' ? 'Production' : 'Development'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.type === 'user'}
            />
          ))}
          
          {isTyping && (
            <div className="flex gap-2 max-w-[80%]">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-orange-500 text-white text-xs">
                  AI
                </AvatarFallback>
              </Avatar>
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-3">
                  <TextShimmer />
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <Card className="rounded-none border-x-0 border-b-0 shadow-sm">
        <CardContent className="p-4">
          {/* File attachments preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Paperclip className="w-3 h-3 mr-1" />
                  {file.name}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <FileUpload 
              onFilesSelected={handleFilesSelected}
              disabled={connectionStatus !== 'connected'}
            />
            
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[40px] max-h-32 resize-none pr-12"
                disabled={connectionStatus !== 'connected'}
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && attachments.length === 0) || connectionStatus !== 'connected'}
                className="absolute right-2 top-2 h-8 w-8 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatInterface