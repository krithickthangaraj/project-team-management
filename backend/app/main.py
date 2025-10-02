from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import SessionLocal  # DB session
from sqlalchemy import text

app = FastAPI()

# ✅ Allow frontend domains to call backend
origins = [
    "http://localhost:5173",                 # Local dev (Vite default port)
    "https://project-team-frontend.vercel.app"  # Deployed frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # restrict access only to your frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Root route (basic check)
@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

# ✅ Test DB connectivity
@app.get("/test-connection")
def test_connection():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        return {"status": "Backend + DB connected!"}
    except Exception as e:
        return {"status": "Error", "details": str(e)}
    finally:
        db.close()

# ✅ Route for frontend test
@app.get("/api/hello")
def hello_from_backend():
    return {"message": "Hello from Backend + DB!"}
