const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const colorEl = document.getElementById('color');
const sizeEl = document.getElementById('size');
const clearBtn = document.getElementById('clear');
const statusEl = document.getElementById('status');
const cursorsEl = document.getElementById('cursors');
const roomLabel = document.getElementById('room-label');

// Extract room name from URL like /r/maths
const roomName = decodeURIComponent(location.pathname.replace(/^\/r\//, ''));
roomLabel.textContent = roomName;
document.title = `${roomName} · Whiteboard`;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - document.querySelector('header').offsetHeight;
}
resize();
window.addEventListener('resize', resize);

const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${wsProto}//${location.host}/ws/${encodeURIComponent(roomName)}`);

let myId = null;
const otherCursors = new Map();

ws.onopen = () => {
  statusEl.textContent = '● Connected';
  statusEl.classList.add('connected');
};
ws.onclose = () => {
  statusEl.textContent = '○ Disconnected';
  statusEl.classList.remove('connected');
  otherCursors.forEach(({ el }) => el.remove());
  otherCursors.clear();
};
ws.onmessage = (event) => {
  const d = JSON.parse(event.data);
  if (d.type === 'welcome') {
    myId = d.id;
  } else if (d.type === 'history') {
    // Replay all past strokes from the room's history
    for (const ev of d.events) {
      if (ev.type === 'draw') {
        drawLine(ev.x0, ev.y0, ev.x1, ev.y1, ev.color, ev.size);
      }
    }
  } else if (d.type === 'draw') {
    drawLine(d.x0, d.y0, d.x1, d.y1, d.color, d.size);
  } else if (d.type === 'clear') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else if (d.type === 'cursor') {
    updateCursor(d.userId, d.userColor, d.x, d.y);
  } else if (d.type === 'user_leave') {
    removeCursor(d.userId);
  }
};

let drawing = false, lastX = 0, lastY = 0;
let lastCursorSent = 0;
const CURSOR_THROTTLE_MS = 40;

canvas.addEventListener('pointerdown', (e) => {
  drawing = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
  canvas.setPointerCapture(e.pointerId);
  e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
  const x = e.offsetX, y = e.offsetY;
  const now = performance.now();
  const shouldSendCursor = e.pointerType === 'touch' ? drawing : true;
  if (shouldSendCursor && ws.readyState === WebSocket.OPEN && now - lastCursorSent > CURSOR_THROTTLE_MS) {
    ws.send(JSON.stringify({ type: 'cursor', x, y }));
    lastCursorSent = now;
  }
  if (!drawing) return;
  const color = colorEl.value, size = +sizeEl.value;
  drawLine(lastX, lastY, x, y, color, size);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'draw', x0: lastX, y0: lastY, x1: x, y1: y, color, size }));
  }
  lastX = x;
  lastY = y;
});

function stopDrawing(e) {
  drawing = false;
  if (e && e.pointerId !== undefined) {
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  }
}
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);
canvas.addEventListener('pointerleave', stopDrawing);

function drawLine(x0, y0, x1, y1, color, size) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function updateCursor(id, color, x, y) {
  if (id === myId) return;
  let entry = otherCursors.get(id);
  if (!entry) {
    const el = document.createElement('div');
    el.className = 'cursor';
    el.innerHTML = `
      <div class="cursor-dot" style="background:${color}"></div>
      <div class="cursor-label" style="background:${color}">${id}</div>
    `;
    cursorsEl.appendChild(el);
    entry = { el };
    otherCursors.set(id, entry);
  }
  entry.el.style.transform = `translate(${x}px, ${y}px)`;
}

function removeCursor(id) {
  const entry = otherCursors.get(id);
  if (entry) {
    entry.el.remove();
    otherCursors.delete(id);
  }
}

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'clear' }));
});