# NECTA - Chat Interface for n8n AI Agents

> **NECTA** is a secure chat interface that bridges users with n8n AI agents via webhook communication.

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

- **Node.js** 18+ and **pnpm** 8+
- **Python** 3.11+ and **uv**
- **n8n instance** (cloud or self-hosted)

### Installation

```bash
# Clone the repository
git clone https://github.com/console-1/necta.git
cd necta

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Frontend setup (using pnpm)
cd frontend
pnpm install
pnpm run dev

# Backend setup (using uv - in new terminal)
cd backend
uv sync
uv run uvicorn app.main:app --reload

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
# Frontend (using pnpm)
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run lint             # Run linting
pnpm run lint:security    # Security-focused linting
pnpm run test             # Run tests
pnpm run test:security    # Security tests
pnpm run test:e2e         # End-to-end tests
pnpm run type-check       # TypeScript checking

# Backend (using uv)
uv run uvicorn app.main:app --reload  # Start with auto-reload
uv run pytest tests/                  # Run tests
uv run pytest tests/security/         # Security tests
uv run ruff check .                   # Lint code
uv run mypy app/                      # Type checking
uv run bandit -r app/                 # Security linting

# Docker
docker-compose up -d                  # Full development environment
```

### Code Quality

The project maintains high code quality standards:

- **TypeScript** with strict mode for frontend type safety
- **Zod validation** for runtime type checking and security
- **Python type hints** with mypy validation
- **ESLint + Prettier** for consistent code style
- **pnpm** for faster, more efficient package management
- **uv** for blazingly fast Python package management
- **Comprehensive testing** with Jest, Playwright, and pytest
- **Security-first development** with automated security testing
- **Bandit + ESLint Security** for vulnerability detection

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
