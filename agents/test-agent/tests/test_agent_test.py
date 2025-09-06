"""
Tests for the Test Agent
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
from datetime import datetime

# Add parent directory to path to import the agent
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestAgentFunctions:
    """Test suite for the test agent functions."""
    
    @pytest.fixture
    def mock_env_vars(self, monkeypatch):
        """Set up mock environment variables."""
        monkeypatch.setenv("GOOGLE_CLOUD_PROJECT_ID", "test-project")
        monkeypatch.setenv("GOOGLE_CLOUD_REGION", "us-central1")
    
    def test_health_check(self, mock_env_vars):
        """Test the health check functionality."""
        from agent import health_check
        
        health_status = health_check()
        
        assert health_status["agent"] == "test-agent"
        assert health_status["version"] == "1.0.0"
        assert health_status["status"] == "healthy"
        assert health_status["project_id"] == "test-project"
        assert health_status["region"] == "us-central1"
        assert "timestamp" in health_status
    
    def test_process_prompt_basic(self, mock_env_vars):
        """Test basic prompt processing."""
        from agent import process_prompt
        
        prompt = "Hello, test agent!"
        response = process_prompt(prompt)
        
        assert response["agent"] == "test-agent"
        assert response["version"] == "1.0.0"
        assert response["prompt_received"] == prompt
        assert response["status"] == "success"
        assert "Test agent successfully received prompt" in response["response"]
        assert response["metadata"]["project_id"] == "test-project"
        assert response["metadata"]["region"] == "us-central1"
    
    def test_process_prompt_with_context(self, mock_env_vars):
        """Test prompt processing with context."""
        from agent import process_prompt
        
        prompt = "Test with context"
        context = "user-session-123"
        response = process_prompt(prompt, context)
        
        assert response["context"] == context
        assert response["status"] == "success"
        assert response["prompt_received"] == prompt
    
    def test_timestamp_format(self, mock_env_vars):
        """Test that timestamps are in ISO format."""
        from agent import health_check
        
        response = health_check()
        timestamp = response["timestamp"]
        
        # Verify it can be parsed as ISO format
        parsed_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        assert parsed_time is not None
    
    def test_response_structure(self, mock_env_vars):
        """Test that response has all required fields."""
        from agent import process_prompt
        
        response = process_prompt("test prompt")
        
        required_fields = ["agent", "version", "timestamp", "prompt_received", 
                          "response", "status", "metadata"]
        for field in required_fields:
            assert field in response
        
        metadata_fields = ["project_id", "region", "initialized_at"]
        for field in metadata_fields:
            assert field in response["metadata"]
    
    @patch('google.adk.agents.Agent')
    def test_agent_creation(self, mock_agent_class, mock_env_vars):
        """Test that the ADK agent is created correctly."""
        # Import the module to trigger agent creation
        import agent
        
        # Verify Agent was instantiated
        mock_agent_class.assert_called_once()
        
        # Check the call arguments
        call_args = mock_agent_class.call_args
        assert call_args.kwargs['name'] == 'test_agent'
        assert call_args.kwargs['model'] == 'gemini-2.0-flash'
        assert 'Test agent for verifying Vertex AI integration' in call_args.kwargs['description']
        assert len(call_args.kwargs['tools']) == 2  # health_check and process_prompt


class TestAgentMainFunction:
    """Test the main function for local testing."""
    
    @patch('builtins.print')
    def test_main_function_execution(self, mock_print):
        """Test that the main function executes correctly."""
        from agent import main
        
        main()
        
        # Verify print was called multiple times
        assert mock_print.call_count >= 4  # At least 4 print statements
        
        # Check for expected output
        print_calls = [str(call) for call in mock_print.call_args_list]
        assert any('Test Agent initialized' in str(call) for call in print_calls)
        assert any('Health Check:' in str(call) for call in print_calls)
        assert any('Prompt Response:' in str(call) for call in print_calls)