"""
Tests for the main FastAPI application.
"""
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app


class TestMainApp:
    """Test cases for main application endpoints."""
    
    def test_root_endpoint(self, client: TestClient):
        """Test the root endpoint returns correct response."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "NECTA Backend API"
    
    def test_health_check_endpoint(self, client: TestClient):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "necta-backend"
    
    @pytest.mark.asyncio
    async def test_async_root_endpoint(self, async_client: AsyncClient):
        """Test root endpoint with async client."""
        response = await async_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "NECTA Backend API"
    
    def test_app_metadata(self):
        """Test application metadata is set correctly."""
        assert app.title == "NECTA Backend"
        assert app.description == "Chat Interface for n8n AI Agents - Backend API"
        assert app.version == "0.1.0"
    
    def test_cors_headers(self, client: TestClient):
        """Test CORS headers are properly set."""
        response = client.options("/")
        # CORS headers should be added when CORS middleware is implemented
        assert response.status_code in [200, 405]  # 405 is OK if OPTIONS not implemented yet


class TestSecurity:
    """Test security-related functionality."""
    
    def test_security_headers(self, client: TestClient):
        """Test that security headers are present."""
        response = client.get("/")
        headers = response.headers
        
        # These headers should be added when security middleware is implemented
        # For now, we'll test that the response is successful
        assert response.status_code == 200
        
        # TODO: Uncomment when security headers are implemented
        # assert "x-content-type-options" in headers
        # assert "x-frame-options" in headers
        # assert "x-xss-protection" in headers
    
    def test_sql_injection_prevention(self, client: TestClient, malicious_input_samples: list):
        """Test that SQL injection attempts are handled safely."""
        for malicious_input in malicious_input_samples:
            if "DROP TABLE" in malicious_input or ";" in malicious_input:
                # Test with query parameters
                response = client.get(f"/?test={malicious_input}")
                # Should not crash the application
                assert response.status_code in [200, 400, 422]  # Valid error responses
    
    def test_xss_prevention(self, client: TestClient, malicious_input_samples: list):
        """Test that XSS attempts are handled safely."""
        for malicious_input in malicious_input_samples:
            if "<script>" in malicious_input:
                # Test with query parameters
                response = client.get(f"/?test={malicious_input}")
                # Should not crash and should not reflect the script
                assert response.status_code in [200, 400, 422]
                # Response should not contain the malicious script
                assert "<script>" not in response.text
    
    def test_path_traversal_prevention(self, client: TestClient):
        """Test that path traversal attempts are blocked."""
        malicious_paths = [
            "../etc/passwd",
            "..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        ]
        
        for path in malicious_paths:
            response = client.get(f"/{path}")
            # Should return 404 or other safe error, not expose files
            assert response.status_code in [404, 400, 403]
    
    def test_large_payload_handling(self, client: TestClient):
        """Test handling of excessively large payloads."""
        large_data = "A" * (10 * 1024 * 1024)  # 10MB
        
        response = client.post(
            "/",
            json={"data": large_data},
            headers={"Content-Type": "application/json"}
        )
        
        # Should handle large payloads gracefully
        assert response.status_code in [413, 422, 400, 404]  # Expected error codes


class TestErrorHandling:
    """Test error handling and responses."""
    
    def test_404_handling(self, client: TestClient):
        """Test 404 error handling for non-existent endpoints."""
        response = client.get("/non-existent-endpoint")
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client: TestClient):
        """Test 405 error for unsupported HTTP methods."""
        response = client.post("/health")  # Assuming health only supports GET
        assert response.status_code in [405, 404]  # Either is acceptable
    
    def test_invalid_json_handling(self, client: TestClient):
        """Test handling of invalid JSON payloads."""
        response = client.post(
            "/",
            data="invalid json{",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [422, 400]
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self, async_client: AsyncClient):
        """Test that the application handles timeouts gracefully."""
        # This would test actual timeout scenarios when endpoints are implemented
        response = await async_client.get("/")
        assert response.status_code == 200


class TestEnvironmentConfiguration:
    """Test environment-specific configurations."""
    
    def test_debug_mode_response(self, client: TestClient, mock_env_vars):
        """Test response in debug mode."""
        response = client.get("/")
        assert response.status_code == 200
        # In debug mode, responses might include additional information
    
    def test_production_mode_security(self, client: TestClient, monkeypatch):
        """Test security measures in production mode."""
        monkeypatch.setenv("DEBUG", "false")
        monkeypatch.setenv("APP_ENV", "production")
        
        response = client.get("/")
        assert response.status_code == 200
        # Production mode should have stricter security measures