// Determine WebSocket protocol based on page protocol
const WS_PROTOCOL = location.protocol === 'https:' ? 'wss:' : 'ws:';
// Use environment variable or fallback for WebSocket URL
const WS_URL = `ws//37.59.107.234:8000/ws`;

let ws = null;
let pseudo = localStorage.getItem('hellpseudo') || '';
let users = [];
let isConnecting = false;
let reconnectTimeout = null;

const usersDiv = document.getElementById('metal-chat-users');
const messagesDiv = document.getElementById('chat-messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');

function setChatEnabled(enabled) {
  input.disabled = !enabled;
  form.querySelector('button[type="submit"]').disabled = !enabled;
  if (enabled) {
    input.focus();
  }
}

function renderUsers() {
  // Always show your pseudo at the start, even if alone
  const allUsers = users.length ? users : (pseudo ? [pseudo] : []);
  usersDiv.innerHTML = `<marquee>Assoifés: ${allUsers.map(u => escapeHTML(u)).join(', ')}</marquee>`;
}

function connectWS() {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting || (ws && ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  // Clear any pending reconnect
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Close existing connection if any
  if (ws) {
    try {
      ws.close();
    } catch (e) {
      console.error('Error closing websocket:', e);
    }
  }

  isConnecting = true;
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    isConnecting = false;
    pseudo = localStorage.getItem('hellpseudo') || '';
    if (pseudo) {
      ws.send(JSON.stringify({ type: 'pseudo', txt: pseudo }));
      setChatEnabled(true);
      renderUsers();
    } else {
      setChatEnabled(false);
    }
  };

  ws.onmessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.error('Error parsing message:', e);
      return;
    }
    if (data.type === 'pseudos') {
      users = data.pseudos || [];
      renderUsers();
    } else if (data.type === 'message') {
      renderMessage(data);
    } else if (data.type === 'history') {
      // Clear existing messages when receiving history
      messagesDiv.innerHTML = '';
      // Render each message in the history
      data.messages.forEach(msg => renderMessage(msg));
    } else if (data.type === 'system') {
      renderSystemMessage(data.txt);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    isConnecting = false;
  };

  ws.onclose = (event) => {
    isConnecting = false;
    setChatEnabled(false);
    // Only reconnect if we have a pseudo and it wasn't a clean closure
    if (pseudo && event.code !== 1000) {
      reconnectTimeout = setTimeout(connectWS, 1000);
    }
  };
}

function renderMessage({ txt, pseudo: msgPseudo, timestamp }) {
  const isMe = msgPseudo === pseudo;
  const msgDiv = document.createElement('div');
  msgDiv.className = 'metal-chat-message' + (isMe ? ' me' : '');
  msgDiv.innerHTML = `
    <span class="metal-chat-pseudo">${escapeHTML(msgPseudo)}</span>
    <span class="metal-chat-time">${formatTime(timestamp ? new Date(timestamp) : new Date())}</span>
    <div class="metal-chat-text">${escapeHTML(txt)}</div>
  `;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderSystemMessage(txt) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'metal-chat-message system';
  msgDiv.innerHTML = `
    <span class="metal-chat-time">${formatTime(new Date())}</span>
    <div class="metal-chat-text">${escapeHTML(txt)}</div>
  `;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/[&<>"]|'/g, function(tag) {
    const chars = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    };
    return chars[tag] || tag;
  });
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const txt = input.value.trim();
  if (!txt || !pseudo || !ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: 'message', txt, pseudo }));
  input.value = '';
});

function onPseudoAvailable(newPseudo) {
  const previousPseudo = pseudo;
  pseudo = newPseudo || localStorage.getItem('hellpseudo') || '';
  
  if (!pseudo) {
    setChatEnabled(false);
    renderUsers();
    return;
  }

  // Only reconnect if we don't have a working connection
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    connectWS();
  } else if (ws.readyState === WebSocket.OPEN && pseudo !== previousPseudo) {
    // If connection is open but pseudo changed, send the new pseudo
    ws.send(JSON.stringify({ type: 'pseudo', txt: pseudo }));
  }

  setChatEnabled(ws && ws.readyState === WebSocket.OPEN);
  renderUsers();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  if (pseudo) {
    connectWS();
  } else {
    setChatEnabled(false);
    renderUsers();
  }
});

// Listen for pseudo changes in other tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'hellpseudo') {
    onPseudoAvailable(e.newValue);
  }
});

// Listen for pseudo set in modal (same tab)
window.addEventListener('pseudoSet', (e) => {
  onPseudoAvailable(e.detail);
});

// Also check on focus in case we missed any changes
window.addEventListener('focus', () => onPseudoAvailable());
