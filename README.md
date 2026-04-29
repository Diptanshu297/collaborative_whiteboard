# Collaborative Whiteboard

Real-time multi-user whiteboard. Multiple people draw on the same canvas, see each other's strokes and cursors live.

## Stack

- **Backend:** FastAPI + WebSockets (Python)
- **Frontend:** Vanilla JS + HTML5 Canvas + Pointer Events
- **Tunnel:** Cloudflare Tunnel for public access

## Features

- Live multi-user drawing synchronized via WebSockets
- Per-user colored cursors with short ID labels
- Touch and stylus support (works on phones, tablets, and laptops)
- Color picker, brush size, clear board

## Run locally

\`\`\`bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

Open `http://localhost:8000` in two browser windows side-by-side. Draw in one, watch it sync to the other.

## Expose to the internet (for cross-device testing)

\`\`\`bash
cloudflared tunnel --url http://localhost:8000
\`\`\`

Open the generated `https://*.trycloudflare.com` URL on your phone — drawings sync between devices in real time.
