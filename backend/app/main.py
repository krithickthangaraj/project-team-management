from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users
from app.routers import projects as projects_router

app = FastAPI(title="Project Team Management")

origins = [
    "http://localhost:5173",
    "https://project-team-frontend.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root
@app.get("/")
def root():
    return {"message": "Backend is running!"}

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects_router.router)

