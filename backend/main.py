import json
import uuid
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent.parent

PALETTE = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
           "#42d4f4", "#f032e6", "#bfef45", "#fabebe", "#469990"]


class ConnectionManager:
    def __init__(self):
        self.active: dict[WebSocket, dict] = {}
        self._counter = 0

    async def connect(self, ws: WebSocket) -> dict:
        await ws.accept()
        user = {
            "id": str(uuid.uuid4())[:6],
            "color": PALETTE[self._counter % len(PALETTE)],
        }
        self._counter += 1
        self.active[ws] = user
        await ws.send_text(json.dumps({"type": "welcome", **user}))
        return user

    def disconnect(self, ws: WebSocket) -> dict | None:
        return self.active.pop(ws, None)

    async def broadcast(self, message: str, sender: WebSocket | None = None):
        for conn in list(self.active.keys()):
            if conn is sender:
                continue
            try:
                await conn.send_text(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    user = await manager.connect(ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            msg["userId"] = user["id"]
            msg["userColor"] = user["color"]
            await manager.broadcast(json.dumps(msg), sender=ws)
    except WebSocketDisconnect:
        info = manager.disconnect(ws)
        if info:
            await manager.broadcast(
                json.dumps({"type": "user_leave", "userId": info["id"]})
            )


app.mount("/", StaticFiles(directory=BASE_DIR / "frontend", html=True), name="frontend")    