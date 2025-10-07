from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.routers import auth, users, tasks, teams
from app.routers import projects as projects_router
from app.routers import admin as admin_router

# WebSocket manager
from app.services.websocket_manager import manager

app = FastAPI(title="Project Team Management")

# ----------------- CORS -----------------
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

# ----------------- ROOT -----------------
@app.get("/")
def root():
    return {"message": "Backend is running!"}

# ----------------- INCLUDE ROUTERS -----------------
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects_router.router)
app.include_router(tasks.router)
app.include_router(teams.router)
app.include_router(admin_router.router)

# ----------------- WEBSOCKET -----------------
@app.websocket("/ws/projects/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    """
    WebSocket connection for a project.
    Broadcasts live task updates to all connected clients of that project.
    """
    await manager.connect(project_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(project_id, websocket)
