"""
n8n Webhook Communication Patterns for NECTA

This example demonstrates secure webhook communication with n8n workflows,
including authentication, retry logic, and error handling.
"""

import asyncio
import json
import logging
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union
from urllib.parse import urljoin

import httpx
from pydantic import BaseModel, Field


class WebhookAuthType(str, Enum):
    """Supported n8n webhook authentication methods."""
    NONE = "none"
    BASIC = "basic"
    HEADER = "header"
    JWT = "jwt"


class WebhookPayloadFormat(str, Enum):
    """Supported webhook payload formats."""
    JSON = "json"
    FORM_DATA = "form_data"
    RAW_BODY = "raw_body"
    BINARY = "binary"


class WebhookAuthConfig(BaseModel):
    """Configuration for webhook authentication."""
    auth_type: WebhookAuthType
    username: Optional[str] = None
    password: Optional[str] = None
    header_key: Optional[str] = None
    header_value: Optional[str] = None
    jwt_token: Optional[str] = None


class WebhookMessage(BaseModel):
    """Message structure for n8n webhook communication."""
    message_id: str = Field(..., description="Unique message identifier")
    user_id: str = Field(..., description="User identifier")
    content: str = Field(..., description="Message content")
    format: str = Field(default="markdown", description="Content format")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    attachments: List[str] = Field(default_factory=list, description="File paths")
    metadata: Dict = Field(default_factory=dict, description="Additional data")


class WebhookResponse(BaseModel):
    """Response from n8n webhook."""
    success: bool
    message_id: str
    agent_response: Optional[str] = None
    response_format: str = "markdown"
    processing_time_ms: Optional[int] = None
    error: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)


class WebhookClient:
    """
    Async client for communicating with n8n webhooks.
    
    Handles authentication, retries, and error recovery according to
    NECTA requirements (max 3 retries, 5-second intervals).
    """
    
    def __init__(
        self,
        base_url: str,
        auth_config: WebhookAuthConfig,
        timeout: float = 30.0,
        max_retries: int = 3,
        retry_delay: float = 5.0
    ):
        self.base_url = base_url
        self.auth_config = auth_config
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.logger = logging.getLogger(__name__)
        
        # Initialize HTTP client with reasonable defaults
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=100)
        )
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()
    
    def _prepare_headers(self) -> Dict[str, str]:
        """
        Prepare headers based on authentication configuration.
        
        Returns:
            Dict containing appropriate headers for the auth method.
        """
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "NECTA-WebhookClient/1.0"
        }
        
        if self.auth_config.auth_type == WebhookAuthType.BASIC:
            import base64
            credentials = f"{self.auth_config.username}:{self.auth_config.password}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            headers["Authorization"] = f"Basic {encoded_credentials}"
        
        elif self.auth_config.auth_type == WebhookAuthType.HEADER:
            headers[self.auth_config.header_key] = self.auth_config.header_value
        
        elif self.auth_config.auth_type == WebhookAuthType.JWT:
            headers["Authorization"] = f"Bearer {self.auth_config.jwt_token}"
        
        return headers
    
    async def send_message(
        self,
        webhook_path: str,
        message: WebhookMessage,
        payload_format: WebhookPayloadFormat = WebhookPayloadFormat.JSON
    ) -> WebhookResponse:
        """
        Send message to n8n webhook with retry logic.
        
        Args:
            webhook_path: Webhook endpoint path
            message: Message to send
            payload_format: Format for the payload
            
        Returns:
            WebhookResponse with agent's reply or error information
            
        Raises:
            httpx.RequestError: After all retries exhausted
        """
        url = urljoin(self.base_url, webhook_path)
        headers = self._prepare_headers()
        
        # Prepare payload based on format
        if payload_format == WebhookPayloadFormat.JSON:
            payload = message.model_dump(mode="json")
        elif payload_format == WebhookPayloadFormat.FORM_DATA:
            payload = message.model_dump()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            # For raw body or binary, convert to JSON for now
            payload = message.model_dump(mode="json")
        
        for attempt in range(self.max_retries + 1):
            try:
                start_time = asyncio.get_event_loop().time()
                
                response = await self.client.post(
                    url=url,
                    json=payload if payload_format == WebhookPayloadFormat.JSON else None,
                    data=payload if payload_format == WebhookPayloadFormat.FORM_DATA else None,
                    headers=headers
                )
                
                end_time = asyncio.get_event_loop().time()
                processing_time_ms = int((end_time - start_time) * 1000)
                
                # Handle response
                if response.status_code == 200:
                    response_data = response.json()
                    return WebhookResponse(
                        success=True,
                        message_id=message.message_id,
                        agent_response=response_data.get("response", ""),
                        response_format=response_data.get("format", "markdown"),
                        processing_time_ms=processing_time_ms,
                        metadata=response_data.get("metadata", {})
                    )
                else:
                    error_msg = f"HTTP {response.status_code}: {response.text}"
                    self.logger.warning(
                        f"Webhook request failed (attempt {attempt + 1}): {error_msg}"
                    )
                    
                    if attempt == self.max_retries:
                        return WebhookResponse(
                            success=False,
                            message_id=message.message_id,
                            error=error_msg,
                            processing_time_ms=processing_time_ms
                        )
            
            except (httpx.RequestError, httpx.TimeoutException) as e:
                error_msg = f"Request error: {str(e)}"
                self.logger.warning(
                    f"Webhook request failed (attempt {attempt + 1}): {error_msg}"
                )
                
                if attempt == self.max_retries:
                    return WebhookResponse(
                        success=False,
                        message_id=message.message_id,
                        error=error_msg
                    )
            
            # Wait before retry (except on last attempt)
            if attempt < self.max_retries:
                await asyncio.sleep(self.retry_delay)
        
        # Should never reach here, but safety fallback
        return WebhookResponse(
            success=False,
            message_id=message.message_id,
            error="Maximum retries exceeded"
        )
    
    async def test_webhook(self, webhook_path: str) -> Dict[str, Union[bool, str]]:
        """
        Test webhook connectivity without sending a real message.
        
        Args:
            webhook_path: Webhook endpoint path
            
        Returns:
            Dict with test results
        """
        test_message = WebhookMessage(
            message_id="test-connection",
            user_id="system",
            content="Connection test",
            metadata={"test": True}
        )
        
        try:
            response = await self.send_message(webhook_path, test_message)
            return {
                "success": response.success,
                "status": "connected" if response.success else "failed",
                "error": response.error,
                "response_time_ms": response.processing_time_ms
            }
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error": str(e)
            }


# Example usage and testing patterns
async def example_webhook_communication():
    """
    Example demonstrating webhook communication patterns.
    """
    # Configure authentication
    auth_config = WebhookAuthConfig(
        auth_type=WebhookAuthType.HEADER,
        header_key="X-Webhook-Token",
        header_value="your-secret-token"
    )
    
    # Create webhook client
    async with WebhookClient(
        base_url="https://your-n8n-instance.com",
        auth_config=auth_config
    ) as client:
        
        # Test connection first
        test_result = await client.test_webhook("/webhook/test")
        print(f"Connection test: {test_result}")
        
        if test_result["success"]:
            # Send actual message
            message = WebhookMessage(
                message_id="msg-001",
                user_id="user-123",
                content="Hello, I need help with my project",
                format="markdown",
                attachments=["project_spec.pdf"]
            )
            
            response = await client.send_message("/webhook/chat", message)
            
            if response.success:
                print(f"Agent responded: {response.agent_response}")
                print(f"Response time: {response.processing_time_ms}ms")
            else:
                print(f"Error: {response.error}")


# Security considerations for webhook communication
class SecureWebhookManager:
    """
    Manages webhook configurations with proper security practices.
    """
    
    def __init__(self, encryption_key: bytes):
        from cryptography.fernet import Fernet
        self.cipher = Fernet(encryption_key)
    
    def encrypt_webhook_config(self, config: WebhookAuthConfig) -> bytes:
        """Encrypt webhook configuration for storage."""
        config_json = config.model_dump_json()
        return self.cipher.encrypt(config_json.encode())
    
    def decrypt_webhook_config(self, encrypted_config: bytes) -> WebhookAuthConfig:
        """Decrypt webhook configuration from storage."""
        config_json = self.cipher.decrypt(encrypted_config).decode()
        config_dict = json.loads(config_json)
        return WebhookAuthConfig(**config_dict)


if __name__ == "__main__":
    # Run example
    asyncio.run(example_webhook_communication())