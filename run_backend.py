import os
import sys
import uvicorn

if __name__ == "__main__":
    # Ensure current directory is in Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    print("Starting AeroTwin Digital Twin FastAPI Server on http://localhost:8000 ...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
