#!/usr/bin/env python3
"""
Main entry point for Railway deployment.
This file imports and runs the FastAPI app from Backend/app/main.py
"""

import sys
from pathlib import Path

# Add Backend directory to Python path
backend_dir = Path(__file__).parent / "Backend"
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app
from app.main import app

if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)