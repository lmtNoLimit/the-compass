"""
Shared utilities for AI agents
"""

from typing import Optional
import os


def get_project_config() -> dict:
    """
    Get project configuration from environment variables.
    
    Returns:
        Dictionary with project configuration
    """
    return {
        "project_id": os.getenv("GOOGLE_CLOUD_PROJECT_ID"),
        "region": os.getenv("GOOGLE_CLOUD_REGION", "us-central1"),
        "credentials_path": os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    }


def validate_environment() -> bool:
    """
    Validate that required environment variables are set.
    
    Returns:
        True if all required variables are set, False otherwise
    """
    required_vars = ["GOOGLE_CLOUD_PROJECT_ID"]
    
    for var in required_vars:
        if not os.getenv(var):
            print(f"Warning: {var} is not set")
            return False
    
    return True