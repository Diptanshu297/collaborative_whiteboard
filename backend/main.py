from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent.parent


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: str, sender: WebSocket):
        for conn in self.active:
            if conn is not sender:
                try:
                    await conn.send_text(message)
                except Exception:
                    pass


manager = ConnectionManager()


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(data, ws)
    except WebSocketDisconnect:
        manager.disconnect(ws)


# Serve the frontend at /
app.mount("/", StaticFiles(directory=BASE_DIR / "frontend", html=True), name="frontend")