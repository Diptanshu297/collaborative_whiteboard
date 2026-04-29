import json
import re
import uuid
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

PALETTE = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
           "#42d4f4", "#f032e6", "#bfef45", "#fabebe", "#469990"]

ROOM_NAME_RE = re.compile(r"^[a-zA-Z0-9_-]{1,32}$")


class Room:
    def __init__(self, name: str):
        self.name = name
        self.connections: dict[WebSocket, dict] = {}
        self._counter = 0

    async def connect(self, ws: WebSocket) -> dict:
        await ws.accept()
        user = {
            "id": str(uuid.uuid4())[:6],
            "color": PALETTE[self._counter % len(PALETTE)],
        }
        self._counter += 1
        self.connections[ws] = user
        await ws.send_text(json.dumps({"type": "welcome", **user, "room": self.name}))
        return user

    def disconnect(self, ws: WebSocket) -> dict | None:
        return self.connections.pop(ws, None)

    async def broadcast(self, message: str, sender: WebSocket | None = None):
        for conn in list(self.connections.keys()):
            if conn is sender:
                continue
            try:
                await conn.send_text(message)
            except Exception:
                pass

    @property
    def user_count(self) -> int:
        return len(self.connections)


class RoomManager:
    def __init__(self):
        self.rooms: dict[str, Room] = {}

    def get_or_create(self, name: str) -> Room:
        if name not in self.rooms:
            self.rooms[name] = Room(name)
        return self.rooms[name]

    def cleanup_if_empty(self, name: str):
        room = self.rooms.get(name)
        if room and room.user_count == 0:
            del self.rooms[name]


manager = RoomManager()


# ---------- Routes ----------

@app.get("/api/rooms")
def list_rooms():
    """Return active rooms with user counts."""
    return [
        {"name": r.name, "users": r.user_count}
        for r in manager.rooms.values()
    ]


@app.get("/r/{room_name}")
def room_page(room_name: str):
    if not ROOM_NAME_RE.match(room_name):
        raise HTTPException(status_code=400, detail="Invalid room name")
    return FileResponse(FRONTEND_DIR / "room.html")


@app.websocket("/ws/{room_name}")
async def ws_endpoint(ws: WebSocket, room_name: str):
    if not ROOM_NAME_RE.match(room_name):
        await ws.close(code=4000)
        return

    room = manager.get_or_create(room_name)
    user = await room.connect(ws)

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            msg["userId"] = user["id"]
            msg["userColor"] = user["color"]
            await room.broadcast(json.dumps(msg), sender=ws)
    except WebSocketDisconnect:
        info = room.disconnect(ws)
        if info:
            await room.broadcast(
                json.dumps({"type": "user_leave", "userId": info["id"]})
            )
        manager.cleanup_if_empty(room_name)


# Static frontend (landing page at /, assets at /style.css etc.)
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")