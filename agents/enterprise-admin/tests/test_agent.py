"""
Tests for Enterprise Admin Agent
"""

import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agent import root_agent, ENTERPRISE_ADMIN_PROMPT


class TestEnterpriseAdminAgent:
    """Test suite for Enterprise Admin persona agent."""
    
    def test_agent_configuration(self):
        """Test that agent is configured correctly."""
        assert root_agent.name == "enterprise_admin"
        assert root_agent.model == "gemini-1.5-flash"
        assert root_agent.temperature == 0.4
        assert root_agent.instruction == ENTERPRISE_ADMIN_PROMPT
        assert root_agent.tools == []
    
    def test_persona_prompt_contains_key_elements(self):
        """Test that the persona prompt contains all required elements."""
        prompt = ENTERPRISE_ADMIN_PROMPT.lower()
        
        # Check for background elements
        assert "enterprise it administrator" in prompt
        assert "10+ years" in prompt
        assert "fortune 500" in prompt
        
        # Check for personality traits
        assert "security" in prompt
        assert "compliance" in prompt
        assert "risk-averse" in prompt
        assert "methodical" in prompt
        
        # Check for pain points
        assert "shadow it" in prompt
        assert "procurement" in prompt
        assert "legacy systems" in prompt
        assert "integration complexity" in prompt
        
        # Check for response style
        assert "vendor support" in prompt
        assert "total cost" in prompt
        assert "sla" in prompt
    
    def test_temperature_setting(self):
        """Test that temperature is set for consistency."""
        # Temperature should be between 0.3 and 0.5 for consistent persona
        assert 0.3 <= root_agent.temperature <= 0.5
    
    def test_no_tools_configured(self):
        """Test that no tools are configured for persona simulation."""
        # Persona agents shouldn't have tools
        assert len(root_agent.tools) == 0
    
    @patch('google.auth.default')
    def test_environment_setup(self, mock_auth):
        """Test that environment is properly configured."""
        mock_auth.return_value = (None, 'test-project-id')
        
        # Re-import to trigger environment setup
        import importlib
        import app.agent
        importlib.reload(app.agent)
        
        assert os.environ.get('GOOGLE_CLOUD_PROJECT') is not None
        assert os.environ.get('GOOGLE_CLOUD_LOCATION') == 'global'
        assert os.environ.get('GOOGLE_GENAI_USE_VERTEXAI') == 'True'


class TestEnterpriseAdminPersonaConsistency:
    """Test persona consistency in responses."""
    
    def test_persona_keywords_in_prompt(self):
        """Test that key enterprise admin keywords are in the prompt."""
        keywords = [
            'enterprise',
            'administrator',
            'security',
            'compliance',
            'vendor',
            'integration',
            'legacy',
            'risk',
            'cost',
            'operational'
        ]
        
        prompt_lower = ENTERPRISE_ADMIN_PROMPT.lower()
        for keyword in keywords:
            assert keyword in prompt_lower, f"Missing keyword: {keyword}"
    
    def test_persona_maintains_professional_tone(self):
        """Test that persona instructions maintain professional tone."""
        # Check for professional language patterns
        assert "experience" in ENTERPRISE_ADMIN_PROMPT.lower()
        assert "responsibilities" in ENTERPRISE_ADMIN_PROMPT.lower()
        assert "decision" in ENTERPRISE_ADMIN_PROMPT.lower()
        assert "evaluation" in ENTERPRISE_ADMIN_PROMPT.lower()
    
    def test_persona_focus_areas(self):
        """Test that all focus areas are covered in the prompt."""
        focus_areas = [
            "security implications",
            "compliance requirements",
            "integration complexity",
            "operational impact",
            "total cost",
            "vendor reliability"
        ]
        
        prompt_lower = ENTERPRISE_ADMIN_PROMPT.lower()
        for area in focus_areas:
            assert area in prompt_lower, f"Missing focus area: {area}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])