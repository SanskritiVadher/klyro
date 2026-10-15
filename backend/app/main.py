from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.config import settings
from backend.app.api.v1.api_router import api_v1_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Klyro Personal Financial Intelligence Workspace API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Unified Error Formatting Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": first_error.get("msg", "Invalid request parameters"),
                "details": {
                    "field": field,
                    "errors": exc.errors()
                }
            }
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict):
        code = exc.detail.get("code", "HTTP_ERROR")
        message = exc.detail.get("message", "An error occurred")
        details = exc.detail.get("details", None)
    else:
        code = "HTTP_ERROR"
        message = str(exc.detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )


# System Health Check Endpoint
@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
    }


# Include versioned REST API routers
app.include_router(api_v1_router)

# Static frontend mounting (if frontend directory exists)
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend_root():
        """Serve the frontend single-page application shell."""
        return FileResponse(str(frontend_dir / "index.html"))
