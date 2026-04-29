const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const colorEl = document.getElementById('color');
const sizeEl = document.getElementById('size');
const clearBtn = document.getElementById('clear');
const statusEl = document.getElementById('status');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - document.querySelector('header').offsetHeight;
}
resize();
window.addEventListener('resize', resize);

const ws = new WebSocket(`ws://${location.host}/ws`);

ws.onopen = () => {
  statusEl.textContent = '● Connected';
  statusEl.classList.add('connected');
};
ws.onclose = () => {
  statusEl.textContent = '○ Disconnected';
  statusEl.classList.remove('connected');
};
ws.onmessage = (event) => {
  const d = JSON.parse(event.data);
  if (d.type === 'draw') drawLine(d.x0, d.y0, d.x1, d.y1, d.color, d.size);
  else if (d.type === 'clear') ctx.clearRect(0, 0, canvas.width, canvas.height);
};

let drawing = false, lastX = 0, lastY = 0;

canvas.addEventListener('mousedown', (e) => {
  drawing = true; lastX = e.offsetX; lastY = e.offsetY;
});
canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const x = e.offsetX, y = e.offsetY;
  const color = colorEl.value, size = +sizeEl.value;
  drawLine(lastX, lastY, x, y, color, size);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'draw', x0: lastX, y0: lastY, x1: x, y1: y, color, size }));
  }
  lastX = x; lastY = y;
});
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseleave', () => drawing = false);

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

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'clear' }));
});