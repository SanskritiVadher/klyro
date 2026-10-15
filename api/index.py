"""Vercel Serverless Function entry point for Klyro FastAPI application."""
import sys
from pathlib import Path

# Ensure the root project directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.main import app

# Vercel's Python runtime discovers and binds the ASGI app instance
