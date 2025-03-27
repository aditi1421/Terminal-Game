// server/index.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid').v4;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const colors = ['\x1b[31m', '\x1b[32m', '\x1b[33m']; // red, green, yellow
const reset = '\x1b[0m';

const gameState = {
  players: {},
};

const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;

wss.on('connection', (ws) => {
  // Assign ID and color
  ws.id = uuid();
  ws.color = colors[Math.floor(Math.random() * colors.length)];
  gameState.players[ws.id] = { x: 0, y: 0 };

  ws.send(`${ws.color}Welcome, ${ws.id}${reset}`);

  broadcast(`${ws.color}${ws.id} has joined.${reset}`, ws);

  ws.on('message', msg => {
    const [command, ...args] = msg.toString().trim().split(' ');

    if (command === 'move') {
      handleMove(ws, args[0]);
    } else if (command === 'say') {
      broadcast(`${ws.color}[${ws.id}]: ${args.join(' ')}${reset}`);
    } else if (command === 'look') {
      renderMap(ws);
      return output;
    } else if (command === 'help') {
      ws.send("Available commands: move north|south|east|west, say <msg>, look");
      return;
    }
    else {
      ws.send(`Unknown command: ${command}`);
    }

  });

  ws.on('close', () => {
    delete gameState.players[ws.id];
    broadcast(`${ws.color}${ws.id} has left.${reset}`);
  });
});

// === Command Handlers ===

function renderMap(ws) {
    const player = gameState.players[ws.id];
    if (!player) return 'No player found.';
  
    let output = '\n Map View:\n';
  
    for (let y = 0; y < MAP_HEIGHT; y++) {
      let row = '';
      for (let x = 0; x < MAP_WIDTH; x++) {
        let symbol = '.';
  
        for (const [id, p] of Object.entries(gameState.players)) {
          if (p.x === x && p.y === y) {
            symbol = id === ws.id ? '🧍' : '👤';
            break;
          }
        }
  
        row += symbol + ' ';
      }
      output += row + '\n';
    }
  
    return output;
  }
  
function handleMove(ws, direction) {
    const player = gameState.players[ws.id];
    if (!player) return;
  
    switch (direction) {
      case 'north': if (player.y > 0) player.y -= 1; break;
      case 'south': if (player.y < MAP_HEIGHT - 1) player.y += 1; break;
      case 'west':  if (player.x > 0) player.x -= 1; break;
      case 'east':  if (player.x < MAP_WIDTH - 1) player.x += 1; break;
      default:
        ws.send('Usage: move north|south|east|west');
        return;
    }
  
    broadcast(`${ws.color}${ws.id} moved to (${player.x}, ${player.y})${reset}`);
}
  

function broadcast(message, exclude) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== exclude) {
      client.send(message);
    }
  });
}

// === Serve frontend ===

app.use(express.static('../client'));

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
