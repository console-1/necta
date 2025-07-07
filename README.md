# NECTA - Chat Interface for n8n AI Agents

> **NECTA** (co-NECTA: CONnector + NEctar) is a secure chat interface that bridges users with n8n AI agents via webhook communication.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0-green.svg)
![Status](https://img.shields.io/badge/status-MVP%20Development-orange.svg)

## Overview

NECTA provides a clean, secure interface for communicating with AI agents running in n8n workflows. It features real-time messaging, secure profile management, and comprehensive analytics integration.

### Key Features

- **🔐 Secure Profile Management** - Encrypted webhook storage with environment toggles
- **💬 Real-time Chat Interface** - WebSocket-based messaging with typing indicators
- **📁 Multi-modal Support** - File uploads for agents that process documents and images
- **📊 Analytics Integration** - Built-in LangSmith monitoring and performance tracking
- **🛡️ Security First** - JWT authentication, AES-256 encryption, MFA support
- **🎨 Modern UI** - n8n-inspired design with dotted canvas background

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **n8n instance** (cloud or self-hosted)

### Installation

```bash
# Clone the repository
git clone https://github.com/console-1/necta.git
cd necta

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Frontend setup
cd frontend
npm install
npm run dev

# Backend setup (in new terminal)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Or use Docker
docker-compose up -d
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Essential configuration
SECRET_KEY="your-jwt-secret-key"
ENCRYPTION_KEY="your-encryption-key"
LANGSMITH_API_KEY="your-langsmith-key"

# n8n integration
N8N_BASE_URL="https://your-n8n-instance.com"

# Database (SQLite for local development)
DATABASE_URL="sqlite:///./necta.db"
```

## Architecture

### Technology Stack

- **Frontend**: Next.js 14, React 18, shadcn/ui, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, async/await patterns
- **Database**: SQLite (local), Supabase (scaling)
- **Security**: JWT tokens, AES-256 encryption
- **Real-time**: WebSockets for live messaging

### Project Structure

```
necta/
├── frontend/           # Next.js application
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   └── lib/          # Utilities
├── backend/           # FastAPI application
│   ├── app/          # Main application
│   │   ├── api/      # API routes
│   │   ├── models/   # Database models
│   │   └── services/ # Business logic
└── examples/         # Code patterns and examples
```

## Development

### Development Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linting
npm run test         # Run tests

# Backend
uvicorn app.main:app --reload  # Start with auto-reload
pytest tests/                  # Run tests
ruff check .                   # Lint code
mypy app/                      # Type checking

# Docker
docker-compose up -d           # Full development environment
```

### Code Quality

The project maintains high code quality standards:

- **TypeScript** with strict mode for frontend type safety
- **Python type hints** with mypy validation
- **ESLint + Prettier** for consistent code style
- **Comprehensive testing** with Jest and pytest
- **Security-focused** development practices

## n8n Integration

NECTA communicates with n8n workflows through secure webhooks:

### Supported Authentication Methods

- **Basic Auth**: Username/password authentication
- **Header Auth**: Custom header key-value pairs
- **JWT**: Token-based authentication
- **None**: No authentication (development only)

### Webhook Features

- **Retry Logic**: Automatic retries with exponential backoff
- **Error Handling**: Graceful degradation and user-friendly messages
- **Payload Support**: JSON, Form Data, Raw Body, Binary Data
- **File Uploads**: Multi-modal agent support up to 16MB

## Security

Security is a core focus of NECTA:

- **🔐 Data Encryption**: AES-256 for sensitive data at rest
- **🛡️ Authentication**: JWT tokens with httpOnly cookies
- **🔑 Secret Management**: Secure environment variable handling
- **📝 Audit Logging**: Comprehensive security event tracking
- **🌐 CORS Protection**: Proper cross-origin request handling

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow code quality standards** (linting, type checking, tests)
3. **Write tests** for new functionality
4. **Submit a pull request** with clear description

### Development Guidelines

- Follow existing code patterns and architecture
- Maintain security-first development practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commits for clear history

## Examples

Check the `examples/` directory for:

- **Workflow Templates**: n8n workflow configurations
- **Component Patterns**: React component examples
- **API Integration**: Webhook communication patterns
- **Security Examples**: Authentication and encryption implementations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides in repository
- **Community**: Open source community support

---

**Built for the n8n and AI automation community**

*NECTA enables seamless communication with your n8n AI agents through a secure, modern interface.*