"""
Test Agent for Vertex AI Integration using Google ADK

This is a simple test agent built with Google's ADK framework
to verify Vertex AI deployment and connectivity.
"""

from typing import Dict, Any
import os
import sys
from datetime import datetime
from google.adk.agents import Agent


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
    name="test_agent",
    model="gemini-2.0-flash",
    description="Test agent for verifying Vertex AI integration",
    instruction="""You are a test agent designed to verify the Vertex AI integration.
    When asked to perform a health check, use the health_check function.
    When asked to process a prompt, use the process_prompt function.
    Always be helpful and provide clear responses about the system status.""",
    tools=[health_check, process_prompt],
)


def main():
    """Main function for testing the agent locally."""
    print("Test Agent initialized")
    
    # Test health check
    health_status = health_check()
    print(f"Health Check: {health_status}")
    
    # Test prompt processing
    test_prompt = "Hello, test agent!"
    response = process_prompt(test_prompt)
    print(f"Prompt Response: {response}")
    
    # Test with context
    response_with_context = process_prompt("Test with context", "user-session-123")
    print(f"Response with Context: {response_with_context}")
    
    print("\nAgent is ready for deployment to Vertex AI")


if __name__ == "__main__":
    # Check for local testing flag
    if len(sys.argv) > 1 and sys.argv[1] == "--local":
        print("Running test agent in local mode...")
        main()
    else:
        print("Test agent ready for deployment to Vertex AI")
        print("Use 'python -m agents.test_agent --local' to test locally")
        print("\nTo deploy to Vertex AI:")
        print("1. Ensure you have set up Google Cloud credentials")
        print("2. Run: gcloud auth application-default login")
        print("3. Deploy using ADK CLI or Vertex AI console")