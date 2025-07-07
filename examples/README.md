# NECTA Examples

This directory contains example files and patterns to help with NECTA development following the CEP framework.

## Directory Structure

### 📁 workflows/
Example n8n workflows for AI agents
- `ai-agent.json` - Complete n8n workflow with webhooks, LLM, memory, and tools

### 📁 api/
API documentation and examples
- `openapi.json` - LangSmith API reference (44k+ lines)
- `webhook-payloads.json` - Sample n8n webhook payload formats

### 📁 patterns/
Code patterns and implementations
- `webhook_communication.py` - n8n webhook interaction patterns
- `profile_management.py` - Profile CRUD with dev/prod toggle
- `security_patterns.py` - AES-256 encryption and JWT examples
- `langsmith_integration.py` - Analytics and monitoring setup
- `testing_patterns.py` - Testing webhooks and chat functionality

### 📁 components/
Frontend component examples
- `chat_interface.tsx` - React chat interface with shadcn
- `profile_form.tsx` - Profile management forms
- `webhook_tester.tsx` - Webhook testing component

## Usage

These examples demonstrate:

1. **n8n Integration**: How to structure workflows and handle webhook communication
2. **Security Patterns**: Proper encryption and authentication implementation
3. **UI Components**: React components following the n8n design system
4. **Testing Approaches**: Comprehensive testing strategies for webhooks and chat
5. **Analytics Integration**: LangSmith monitoring and metrics collection

Each example includes:
- Complete, working code
- Detailed comments explaining the implementation
- Security considerations
- Testing examples
- Performance optimizations

## Development Guidelines

- Follow the patterns established in these examples
- Maintain consistency with the CEP framework
- Keep files under 500 lines (split into modules if needed)
- Include comprehensive error handling
- Add unit tests for all new patterns
- Document any deviations from these examples