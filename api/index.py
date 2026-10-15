"""Vercel Serverless Function entry point for Klyro FastAPI application."""
import sys
from pathlib import Path

# Ensure the root project directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

try:
    from backend.app.main import app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse

    err_trace = traceback.format_exc()
    print("FATAL ERROR DURING APP STARTUP:\n", err_trace)

    app = FastAPI()

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def debug_startup_failure(full_path: str):
        return PlainTextResponse(
            f"Klyro Backend Startup Error:\n\n{err_trace}",
            status_code=500
        )
