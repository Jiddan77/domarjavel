import os, sys

# Add Backend path (relative to Frontend) to sys.path for imports on Vercel
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../Backend"))
if os.path.isdir(backend_path) and backend_path not in sys.path:
    sys.path.append(backend_path)

from app.main import app as fastapi_app
app = fastapi_app  # ASGI app for Vercel Python runtime
