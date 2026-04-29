# Collaborative Whiteboard

Real-time multi-user whiteboard. FastAPI WebSocket backend + HTML5 Canvas frontend.

## Run
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

Open http://localhost:8000 in two browser windows. Draw in one, watch it sync to the other.