<div align="center">

# 🎨 Collaborative Whiteboard

**A real-time, multi-user whiteboard built with FastAPI WebSockets and HTML5 Canvas.**

Draw together with anyone, anywhere — strokes and cursors sync live across browsers, phones, and tablets.

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-4353FF)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

</div>

---



---

## ✨ Features

| | |
|---|---|
| 🖌️ **Real-time drawing** | Strokes sync instantly across all connected clients via WebSockets |
| 👥 **Live cursors** | See where everyone else is pointing, each user color-coded with a short ID |
| 📱 **Touch & stylus support** | Works seamlessly on phones, tablets, and pen displays via Pointer Events |
| 🎨 **Drawing tools** | Color picker, adjustable brush size, one-click clear |
| ⚡ **Zero frontend dependencies** | Pure vanilla JS, no build step, no framework |
| 🌐 **Public tunnel ready** | One-line Cloudflare Tunnel for cross-device testing on any network |

---

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────────────┐         ┌─────────────┐
│   Browser   │◄──WSS──►│  FastAPI WebSocket   │◄──WSS──►│   Browser   │
│  (Laptop)   │         │  ConnectionManager   │         │   (Phone)   │
└─────────────┘         └──────────────────────┘         └─────────────┘
        │                          │                              │
        │                          ▼                              │
        │                ┌──────────────────┐                     │
        └────────────────►  Static Frontend ◄─────────────────────┘
                         │ HTML5 Canvas +   │
                         │   Vanilla JS     │
                         └──────────────────┘
```

The server maintains a single shared connection pool. Each event (`draw`, `cursor`, `clear`) is broadcast to all connected clients except the sender, with the server stamping a unique color and ID per connection.

---

## 🛠️ Tech Stack

- **Backend** — [FastAPI](https://fastapi.tiangolo.com/) with native WebSocket support, served by [Uvicorn](https://www.uvicorn.org/)
- **Frontend** — Vanilla JavaScript, [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API), [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- **Networking** — WebSocket protocol over WSS, optional [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) for public access

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- pip and venv (`sudo apt install python3-venv` on Debian/Ubuntu)

### Installation

```bash
git clone https://github.com/Diptanshu297/collaborative_whiteboard.git
cd collaborative_whiteboard

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Running the server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open `http://localhost:8000` in two browser windows side-by-side and start drawing — strokes sync instantly between them.

---

## 🌍 Cross-device testing

To draw between your laptop and phone (or share with anyone on the internet), expose the local server through a Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:8000
```

This prints a public `https://*.trycloudflare.com` URL. Open it on any device, anywhere — it works even on locked-down WiFi networks where local IP access is blocked.

> **Note:** The free quick-tunnel URL changes on each restart. For a permanent URL, set up a [named tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/) with a Cloudflare account.

---

## 📂 Project Structure

```
collaborative_whiteboard/
├── backend/
│   ├── main.py            # FastAPI app + WebSocket endpoint + ConnectionManager
│   └── requirements.txt   # fastapi, uvicorn[standard]
├── frontend/
│   ├── index.html         # Canvas + toolbar markup
│   ├── style.css          # Layout, mobile breakpoints, cursor styling
│   └── script.js          # WebSocket client, drawing loop, cursor rendering
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap

- [x] Real-time multi-user drawing
- [x] Live colored cursors per user
- [x] Touch and stylus support
- [ ] Named rooms (separate boards per URL)
- [ ] Stroke persistence across server restarts
- [ ] Undo / redo
- [ ] Eraser tool
- [ ] PNG export
- [ ] User authentication
- [ ] Permanent deployment

---

## 🤝 Contributing

Pull requests welcome. For major changes, please open an issue first to discuss what you'd like to change.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ☕ and FastAPI

</div>
