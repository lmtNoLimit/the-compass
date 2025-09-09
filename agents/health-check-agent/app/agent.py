from typing import Dict, Any
import os
import sys
from datetime import datetime

import google.auth
from google.adk.agents import Agent


_, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

def health_check() -> Dict[str, Any]:
    """
    Perform a health check on the agent.
    
    Returns:
        Health check status dictionary
    """
    return {
        "agent": "test-agent",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "project_id": os.getenv("GOOGLE_CLOUD_PROJECT_ID"),
        "region": os.getenv("GOOGLE_CLOUD_REGION", "us-central1")
    }


def process_prompt(prompt: str, context: str = "") -> Dict[str, Any]:
    """
    Process a test prompt and return a response.
    
    Args:
        prompt: The input prompt to process
        context: Optional context information
        
    Returns:
        Dictionary with response data
    """
    response = {
        "agent": "test-agent",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "prompt_received": prompt,
        "response": f"Test agent successfully received prompt: '{prompt}'",
        "status": "success",
        "metadata": {
            "project_id": os.getenv("GOOGLE_CLOUD_PROJECT_ID"),
            "region": os.getenv("GOOGLE_CLOUD_REGION", "us-central1"),
            "initialized_at": datetime.utcnow().isoformat()
        }
    }
    
    if context:
        response["context"] = context
    
    return response


# Create the ADK agent
root_agent = Agent(
    name="root_agent",
    model="gemini-2.5-flash",
    description="Test agent for verifying Vertex AI integration",
    instruction="""You are a test agent designed to verify the Vertex AI integration.
    When asked to perform a health check, use the health_check function.
    When asked to process a prompt, use the process_prompt function.
    Always be helpful and provide clear responses about the system status.""",
    tools=[health_check, process_prompt],
)

