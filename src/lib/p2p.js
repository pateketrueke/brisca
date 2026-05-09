import { writable } from 'svelte/store';
import { Peer } from 'peerjs';

const INITIAL_STATE = {
  mode: 'offline',
  status: 'idle',
  roomCode: '',
  peerId: '',
  seat: 'p2',
  requestedRole: 'player',
  peers: [],
  error: '',
};

const listeners = {
  action: new Set(),
  state: new Set(),
};

export const p2pStore = writable({ ...INITIAL_STATE });

let snapshot = { ...INITIAL_STATE };
p2pStore.subscribe((value) => {
  snapshot = value;
});

let peer = null;
let hostConnection = null;
const guestConnections = new Map();
const roster = new Map();

function emit(type, ...args) {
  listeners[type].forEach((listener) => listener(...args));
}

function updateStore(patch) {
  p2pStore.update((value) => ({ ...value, ...patch }));
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function sortPeers(peers) {
  return peers.slice().sort((left, right) => {
    const leftSeat = left.seat || 'z';
    const rightSeat = right.seat || 'z';
    return leftSeat.localeCompare(rightSeat) || left.peerId.localeCompare(right.peerId);
  });
}

function syncPeers() {
  const peers = sortPeers(Array.from(roster.values()));
  updateStore({ peers });

  if (snapshot.mode === 'host') {
    const payload = {
      type: 'room',
      payload: {
        roomCode: snapshot.roomCode,
        peers,
      },
    };

    guestConnections.forEach((connection) => {
      if (connection.open) connection.send(payload);
    });
  }
}

function findSeatOwner(seat, excludedPeerId = '') {
  return Array.from(roster.values()).find((peerInfo) => {
    return peerInfo.peerId !== excludedPeerId && peerInfo.role === 'player' && peerInfo.seat === seat;
  });
}

function clearConnections() {
  guestConnections.forEach((connection) => {
    try {
      connection.close();
    } catch {
      // ignore
    }
  });
  guestConnections.clear();

  if (hostConnection) {
    try {
      hostConnection.close();
    } catch {
      // ignore
    }
  }
  hostConnection = null;

  if (peer) {
    try {
      peer.destroy();
    } catch {
      // ignore
    }
  }
  peer = null;
  roster.clear();
}

function resetRoomState() {
  clearConnections();
  p2pStore.set({ ...INITIAL_STATE });
}

function setError(message) {
  updateStore({ error: message, status: 'error' });
}

function updateGuestPresence() {
  if (!hostConnection?.open) return;
  hostConnection.send({
    type: 'join',
    role: snapshot.requestedRole,
    seat: snapshot.requestedRole === 'player' ? snapshot.seat : null,
  });
}

function attachGuestConnection(connection) {
  connection.on('open', () => {
    updateStore({ status: 'connected', error: '' });
    updateGuestPresence();
  });

  connection.on('data', (message) => {
    if (!message || typeof message !== 'object') return;

    if (message.type === 'state') {
      emit('state', message.payload);
      return;
    }

    if (message.type === 'room') {
      updateStore({
        roomCode: message.payload?.roomCode || snapshot.roomCode,
        peers: sortPeers(message.payload?.peers || []),
      });
      return;
    }

    if (message.type === 'error') {
      setError(message.message || 'Peer error');
    }
  });

  connection.on('close', () => {
    updateStore({ status: 'closed' });
  });

  connection.on('error', (error) => {
    setError(error?.message || 'Peer connection failed');
  });
}

function attachHostConnection(connection) {
  guestConnections.set(connection.peer, connection);

  connection.on('open', () => {
    roster.set(connection.peer, {
      peerId: connection.peer,
      role: 'spectator',
      seat: null,
      status: 'connected',
    });
    syncPeers();
  });

  connection.on('data', (message) => {
    if (!message || typeof message !== 'object') return;

    if (message.type === 'join') {
      const nextRole = message.role === 'spectator' ? 'spectator' : 'player';
      const requestedSeat = nextRole === 'player' ? message.seat || null : null;
      const seatOwner = requestedSeat ? findSeatOwner(requestedSeat, connection.peer) : null;

      if (nextRole === 'player' && (!requestedSeat || requestedSeat === 'p1')) {
        connection.send({
          type: 'error',
          message: 'That seat is not available in this room',
        });
        roster.set(connection.peer, {
          peerId: connection.peer,
          role: 'spectator',
          seat: null,
          status: 'connected',
        });
        syncPeers();
        return;
      }

      if (seatOwner) {
        connection.send({
          type: 'error',
          message: `Seat ${requestedSeat} is already taken`,
        });
        roster.set(connection.peer, {
          peerId: connection.peer,
          role: 'spectator',
          seat: null,
          status: 'connected',
        });
        syncPeers();
        return;
      }

      roster.set(connection.peer, {
        peerId: connection.peer,
        role: nextRole,
        seat: requestedSeat,
        status: 'connected',
      });
      syncPeers();
      return;
    }

    if (message.type === 'action') {
      emit('action', message, roster.get(connection.peer) || { peerId: connection.peer });
    }
  });

  connection.on('close', () => {
    guestConnections.delete(connection.peer);
    roster.delete(connection.peer);
    syncPeers();
  });

  connection.on('error', (error) => {
    guestConnections.delete(connection.peer);
    roster.delete(connection.peer);
    syncPeers();
    setError(error?.message || 'Peer connection failed');
  });
}

export function createRoom({ seat = 'p1' } = {}) {
  if (!isBrowser()) return;
  resetRoomState();

  updateStore({
    mode: 'host',
    status: 'connecting',
    seat,
    requestedRole: 'player',
  });

  peer = new Peer();
  peer.on('open', (id) => {
    roster.set(id, {
      peerId: id,
      role: 'host',
      seat,
      status: 'connected',
    });
    updateStore({
      mode: 'host',
      status: 'connected',
      peerId: id,
      roomCode: id,
      error: '',
    });
    syncPeers();
  });
  peer.on('connection', attachHostConnection);
  peer.on('error', (error) => setError(error?.message || 'Peer startup failed'));
  peer.on('close', () => updateStore({ status: 'closed' }));
}

export function joinRoom(roomCode, options = {}) {
  if (!isBrowser()) return;
  resetRoomState();

  const requestedRole = options.role === 'spectator' ? 'spectator' : 'player';
  const seat = options.seat || 'p2';

  updateStore({
    mode: 'guest',
    status: 'connecting',
    roomCode,
    seat,
    requestedRole,
  });

  peer = new Peer();
  peer.on('open', (id) => {
    updateStore({ peerId: id, error: '' });
    hostConnection = peer.connect(roomCode, { serialization: 'json' });
    attachGuestConnection(hostConnection);
  });
  peer.on('error', (error) => setError(error?.message || 'Peer startup failed'));
  peer.on('close', () => updateStore({ status: 'closed' }));
}

export function leaveRoom() {
  resetRoomState();
}

export function updateJoinRole(role) {
  const requestedRole = role === 'spectator' ? 'spectator' : 'player';
  updateStore({ requestedRole });
  if (snapshot.mode === 'guest' && snapshot.status === 'connected') {
    updateGuestPresence();
  }
}

export function updateJoinSeat(seat) {
  updateStore({ seat });
  if (snapshot.mode === 'guest' && snapshot.status === 'connected') {
    updateGuestPresence();
  }
}

export function broadcastState(stateFactory) {
  if (snapshot.mode !== 'host') return;
  guestConnections.forEach((connection) => {
    if (!connection.open) return;
    const meta = roster.get(connection.peer) || { peerId: connection.peer };
    connection.send({
      type: 'state',
      payload: stateFactory(meta),
    });
  });
}

export function sendAction(name, args = []) {
  if (!hostConnection?.open) return;
  hostConnection.send({ type: 'action', name, args });
}

export function sendError(peerId, message) {
  const connection = guestConnections.get(peerId);
  if (!connection?.open) return;
  connection.send({ type: 'error', message });
}

export function onState(listener) {
  listeners.state.add(listener);
  return () => listeners.state.delete(listener);
}

export function onAction(listener) {
  listeners.action.add(listener);
  return () => listeners.action.delete(listener);
}

export function getConnectionSeat(peerId) {
  return roster.get(peerId)?.seat || null;
}

export function getSnapshot() {
  return snapshot;
}
