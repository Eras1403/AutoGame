const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 32;
const mapWidth = 24;
const mapHeight = 16;

const tile = {
  floor: 0,
  wall: 1,
  water: 2,
  grass: 3,
  sand: 4,
  gateClosed: 5,
  gateOpen: 6,
  portalInactive: 7,
  portalActive: 8,
  switchOff: 9,
  switchOn: 10,
  sign: 11,
};

const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 1, 4, 3, 2, 2, 2, 3, 3, 3, 3, 3, 1],
  [1, 3, 2, 0, 2, 3, 3, 3, 3, 3, 3, 4, 1, 4, 3, 2, 0, 2, 3, 3, 3, 3, 3, 1],
  [1, 3, 2, 0, 2, 3, 3, 3, 3, 3, 3, 4, 1, 4, 3, 2, 0, 2, 3, 3, 3, 3, 3, 1],
  [1, 3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 1, 4, 3, 2, 2, 2, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 1, 1, 1, 3, 3, 4, 1, 4, 3, 3, 3, 3, 3, 1, 1, 1, 3, 1],
  [1, 3, 3, 3, 3, 3, 1, 9, 1, 3, 3, 4, 1, 4, 3, 3, 3, 3, 3, 1, 11, 1, 3, 1],
  [1, 3, 3, 3, 3, 3, 1, 1, 1, 3, 3, 4, 1, 4, 3, 3, 3, 3, 3, 1, 1, 1, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 1],
  [1, 4, 1, 1, 1, 1, 1, 1, 4, 3, 3, 3, 3, 3, 3, 3, 4, 1, 1, 1, 1, 4, 3, 1],
  [1, 4, 1, 7, 1, 3, 3, 1, 4, 3, 3, 3, 3, 3, 3, 3, 4, 1, 6, 1, 1, 4, 3, 1],
  [1, 4, 1, 1, 1, 3, 3, 1, 4, 3, 3, 3, 3, 3, 3, 3, 4, 1, 1, 1, 1, 4, 3, 1],
  [1, 4, 4, 4, 4, 4, 4, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 4, 4, 4, 4, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const player = {
  x: 2,
  y: 2,
  facing: "down",
};

const coins = [
  { x: 5, y: 2, collected: false },
  { x: 15, y: 4, collected: false },
  { x: 10, y: 10, collected: false },
  { x: 18, y: 11, collected: false },
];

const npcs = [
  { x: 12, y: 6, message: "Die Runen reagieren auf Münzen. Sammle sie!" },
];

const signs = [
  { x: 20, y: 7, message: "Drücke E, um Schalter zu nutzen." },
];

const portal = { x: 3, y: 12, active: false };
const gate = { x: 18, y: 12, open: true };
const switchTile = { x: 7, y: 7, on: false };

const hudCoins = document.getElementById("coins");
const hudSwitch = document.getElementById("switch");
const hudPortal = document.getElementById("portal");
const logList = document.getElementById("log");

const eventBus = new EventTarget();

const signals = {
  coin: "signal:coin",
  switch: "signal:switch",
  gate: "signal:gate",
  portal: "signal:portal",
  npc: "signal:npc",
  sign: "signal:sign",
};

const signalMeta = {
  [signals.coin]: { icon: "🪙", title: "Münze eingesammelt" },
  [signals.switch]: { icon: "🔆", title: "Schalter umgelegt" },
  [signals.gate]: { icon: "🚪", title: "Torstatus geändert" },
  [signals.portal]: { icon: "🌀", title: "Portal aktiviert" },
  [signals.npc]: { icon: "💬", title: "NPC" },
  [signals.sign]: { icon: "📜", title: "Schild" },
};

function pushLog(type, detail) {
  const meta = signalMeta[type];
  const entry = document.createElement("li");
  entry.textContent = `${meta.icon} ${meta.title} — ${detail}`;
  logList.prepend(entry);
  while (logList.children.length > 6) {
    logList.removeChild(logList.lastChild);
  }
}

Object.entries(signalMeta).forEach(([type]) => {
  eventBus.addEventListener(type, (event) => {
    pushLog(type, event.detail);
  });
});

function emit(type, detail) {
  eventBus.dispatchEvent(new CustomEvent(type, { detail }));
}

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return tile.wall;
  return map[y][x];
}

function setTile(x, y, value) {
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return;
  map[y][x] = value;
}

function drawTile(x, y, type) {
  const px = x * tileSize;
  const py = y * tileSize;

  if (type === tile.floor) {
    drawGround(px, py, "#2f3b60", "#242d4e");
  } else if (type === tile.wall) {
    drawBlock(px, py, "#6f7a9b", "#4e5b7d");
  } else if (type === tile.water) {
    drawLiquid(px, py, "#2b6ce7", "#184ea8");
  } else if (type === tile.grass) {
    drawGround(px, py, "#2d5f3c", "#20472b");
  } else if (type === tile.sand) {
    drawGround(px, py, "#b59a5b", "#907645");
  } else if (type === tile.gateClosed) {
    drawGate(px, py, false);
  } else if (type === tile.gateOpen) {
    drawGate(px, py, true);
  } else if (type === tile.portalInactive) {
    drawPortal(px, py, false);
  } else if (type === tile.portalActive) {
    drawPortal(px, py, true);
  } else if (type === tile.switchOff) {
    drawSwitch(px, py, false);
  } else if (type === tile.switchOn) {
    drawSwitch(px, py, true);
  } else if (type === tile.sign) {
    drawSign(px, py);
  }
}

function drawGround(x, y, light, dark) {
  ctx.fillStyle = light;
  ctx.fillRect(x, y, tileSize, tileSize);
  ctx.fillStyle = dark;
  ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x + 2, y + 2, tileSize - 4, 6);
}

function drawBlock(x, y, light, dark) {
  ctx.fillStyle = dark;
  ctx.fillRect(x, y, tileSize, tileSize);
  ctx.fillStyle = light;
  ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
}

function drawLiquid(x, y, light, dark) {
  ctx.fillStyle = dark;
  ctx.fillRect(x, y, tileSize, tileSize);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 10);
  ctx.bezierCurveTo(x + 10, y + 2, x + 22, y + 16, x + 28, y + 8);
  ctx.bezierCurveTo(x + 26, y + 20, x + 12, y + 30, x + 4, y + 22);
  ctx.closePath();
  ctx.fill();
}

function drawGate(x, y, open) {
  drawBlock(x, y, "#c58c2b", "#8b5a13");
  ctx.fillStyle = open ? "#1bd16a" : "#e35b5b";
  ctx.fillRect(x + 10, y + 8, 12, 16);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(x + 13, y + 10, 4, 6);
}

function drawPortal(x, y, active) {
  drawGround(x, y, "#1e233b", "#13182e");
  ctx.strokeStyle = active ? "#72f1ff" : "#4c6cff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSwitch(x, y, on) {
  drawGround(x, y, "#2f3b60", "#242d4e");
  ctx.fillStyle = on ? "#ffd66b" : "#7f8db6";
  ctx.fillRect(x + 8, y + 12, 16, 8);
  ctx.fillStyle = "#1b2035";
  ctx.fillRect(x + 12, y + 10, 8, 4);
}

function drawSign(x, y) {
  drawGround(x, y, "#2f3b60", "#242d4e");
  ctx.fillStyle = "#d1b07a";
  ctx.fillRect(x + 10, y + 8, 12, 14);
  ctx.fillStyle = "#8c6f43";
  ctx.fillRect(x + 14, y + 22, 4, 6);
}

function drawCoin(x, y, collected) {
  if (collected) return;
  const px = x * tileSize + 8;
  const py = y * tileSize + 8;
  ctx.fillStyle = "#f4ce4b";
  ctx.beginPath();
  ctx.arc(px + 8, py + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(px + 5, py + 5, 4, 6);
}

function drawNpc(x, y) {
  const px = x * tileSize;
  const py = y * tileSize;
  ctx.fillStyle = "#bf8bff";
  ctx.fillRect(px + 6, py + 6, 20, 20);
  ctx.fillStyle = "#1b122b";
  ctx.fillRect(px + 10, py + 10, 4, 4);
  ctx.fillRect(px + 18, py + 10, 4, 4);
  ctx.fillStyle = "#4e2a7a";
  ctx.fillRect(px + 12, py + 18, 8, 4);
}

function drawPlayer() {
  const px = player.x * tileSize;
  const py = player.y * tileSize;
  ctx.fillStyle = "#4dd4ff";
  ctx.fillRect(px + 6, py + 6, 20, 20);
  ctx.fillStyle = "#0b1626";
  ctx.fillRect(px + 10, py + 10, 4, 4);
  ctx.fillRect(px + 18, py + 10, 4, 4);
  ctx.fillStyle = "#1c3959";
  ctx.fillRect(px + 12, py + 18, 8, 4);
  ctx.fillStyle = "#9af0ff";
  if (player.facing === "down") {
    ctx.fillRect(px + 12, py + 22, 8, 4);
  } else if (player.facing === "up") {
    ctx.fillRect(px + 12, py + 6, 8, 4);
  } else if (player.facing === "left") {
    ctx.fillRect(px + 6, py + 12, 4, 8);
  } else {
    ctx.fillRect(px + 22, py + 12, 4, 8);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mapHeight; y += 1) {
    for (let x = 0; x < mapWidth; x += 1) {
      drawTile(x, y, map[y][x]);
    }
  }
  coins.forEach((coin) => drawCoin(coin.x, coin.y, coin.collected));
  npcs.forEach((npc) => drawNpc(npc.x, npc.y));
  drawPlayer();
}

function updateHud() {
  const collected = coins.filter((coin) => coin.collected).length;
  hudCoins.textContent = `${collected}/${coins.length}`;
  hudSwitch.textContent = switchTile.on ? "An" : "Aus";
  hudPortal.textContent = portal.active ? "Aktiv" : "Inaktiv";
}

function canWalkTo(x, y) {
  const target = tileAt(x, y);
  if (target === tile.wall || target === tile.water) return false;
  if (x === gate.x && y === gate.y && !gate.open) return false;
  return true;
}

function movePlayer(dx, dy, facing) {
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  player.facing = facing;
  if (!canWalkTo(nextX, nextY)) return;
  player.x = nextX;
  player.y = nextY;
  handleStep();
}

function handleStep() {
  const coin = coins.find((item) => item.x === player.x && item.y === player.y && !item.collected);
  if (coin) {
    coin.collected = true;
    emit(signals.coin, `Münzenstand ${coins.filter((c) => c.collected).length}/${coins.length}`);
  }

  if (player.x === switchTile.x && player.y === switchTile.y) {
    switchTile.on = !switchTile.on;
    setTile(switchTile.x, switchTile.y, switchTile.on ? tile.switchOn : tile.switchOff);
    gate.open = switchTile.on;
    setTile(gate.x, gate.y, gate.open ? tile.gateOpen : tile.gateClosed);
    emit(signals.switch, switchTile.on ? "Schalter aktiviert" : "Schalter deaktiviert");
    emit(signals.gate, gate.open ? "Tor geöffnet" : "Tor geschlossen");
  }

  if (!portal.active && coins.every((item) => item.collected)) {
    portal.active = true;
    setTile(portal.x, portal.y, tile.portalActive);
    emit(signals.portal, "Das Portal pulsiert vor Energie.");
  }

  if (portal.active && player.x === portal.x && player.y === portal.y) {
    emit(signals.portal, "Teleportation abgeschlossen. Willkommen in Zone 2.");
  }

  updateHud();
}

function interact() {
  const target = getFacingTile();
  const sign = signs.find((item) => item.x === target.x && item.y === target.y);
  if (sign) {
    emit(signals.sign, sign.message);
    return;
  }

  const npc = npcs.find((item) => item.x === target.x && item.y === target.y);
  if (npc) {
    emit(signals.npc, npc.message);
    return;
  }

  if (target.x === switchTile.x && target.y === switchTile.y) {
    switchTile.on = !switchTile.on;
    setTile(switchTile.x, switchTile.y, switchTile.on ? tile.switchOn : tile.switchOff);
    gate.open = switchTile.on;
    setTile(gate.x, gate.y, gate.open ? tile.gateOpen : tile.gateClosed);
    emit(signals.switch, switchTile.on ? "Schalter aktiviert" : "Schalter deaktiviert");
    emit(signals.gate, gate.open ? "Tor geöffnet" : "Tor geschlossen");
    updateHud();
  }
}

function getFacingTile() {
  if (player.facing === "up") return { x: player.x, y: player.y - 1 };
  if (player.facing === "down") return { x: player.x, y: player.y + 1 };
  if (player.facing === "left") return { x: player.x - 1, y: player.y };
  return { x: player.x + 1, y: player.y };
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    movePlayer(0, -1, "up");
  } else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    movePlayer(0, 1, "down");
  } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    movePlayer(-1, 0, "left");
  } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    movePlayer(1, 0, "right");
  } else if (event.key.toLowerCase() === "e") {
    interact();
  }
});

function init() {
  setTile(gate.x, gate.y, gate.open ? tile.gateOpen : tile.gateClosed);
  setTile(portal.x, portal.y, portal.active ? tile.portalActive : tile.portalInactive);
  setTile(switchTile.x, switchTile.y, switchTile.on ? tile.switchOn : tile.switchOff);
  updateHud();
  draw();
  requestAnimationFrame(loop);
}

function loop() {
  draw();
  requestAnimationFrame(loop);
}

init();
