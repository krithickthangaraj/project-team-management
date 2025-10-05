from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages WebSocket connections per project.
    Allows broadcasting messages to all connected clients for a project.
    """
    def __init__(self):
        # project_id → list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, project_id: int, websocket: WebSocket):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        print(f"[WS] Connected client to project {project_id}. Total connections: {len(self.active_connections[project_id])}")

    def disconnect(self, project_id: int, websocket: WebSocket):
        if project_id in self.active_connections and websocket in self.active_connections[project_id]:
            self.active_connections[project_id].remove(websocket)
            print(f"[WS] Disconnected client from project {project_id}. Remaining: {len(self.active_connections[project_id])}")

    async def broadcast(self, project_id: int, message: dict):
        """
        Broadcasts a JSON message to all WebSocket clients connected to a project.
        """
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"❌ Error sending WebSocket message: {e}")


# Singleton instance
manager = ConnectionManager()
