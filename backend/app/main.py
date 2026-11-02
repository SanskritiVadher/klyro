from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
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


# Development Cache-Control Middleware for Frontend Static Assets
@app.middleware("http")
async def dev_static_cache_middleware(request: Request, call_next):
    response = await call_next(request)
    if settings.APP_ENV == "development" or settings.DEBUG:
        path = request.url.path
        if path.startswith("/static") or path in ("/", "/index.html"):
            response.headers["Cache-Control"] = "no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"
    return response


# Unified Error Formatting Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    msg = first_error.get("msg", "Invalid request parameters")
    if msg.startswith("Value error, "):
        msg = msg[len("Value error, "):]

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
                "details": {
                    "field": field,
                    "errors": jsonable_encoder(errors)
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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) or "An internal server error occurred."
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
possible_frontend_dirs = [
    Path(__file__).resolve().parent.parent.parent / "frontend",
    Path.cwd() / "frontend",
    Path("frontend").resolve(),
]
frontend_dir = None
for p in possible_frontend_dirs:
    if p.exists() and (p / "index.html").exists():
        frontend_dir = p
        break

if frontend_dir:
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/", include_in_schema=False)
    @app.get("/index.html", include_in_schema=False)
    def serve_frontend_root():
        """Serve the frontend single-page application shell."""
        return FileResponse(str(frontend_dir / "index.html"))
