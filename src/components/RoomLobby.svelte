<script>
  let {
    pendingPlayers = [],
    mode = 'offline',
    status = 'idle',
    roomCode = '',
    joinCode = '',
    requestedRole = 'player',
    selectedSeat = 'p2',
    peers = [],
    shareUrl = '',
    error = '',
    linkDetected = false,
    canCreate = true,
    canJoin = true,
    onCreateRoom = undefined,
    onJoinRoom = undefined,
    onLeaveRoom = undefined,
    onCopyLink = undefined,
    onJoinCodeInput = undefined,
    onRequestedRoleChange = undefined,
    onSelectedSeatChange = undefined,
  } = $props();

  function getSeatOccupant(seat) {
    return peers.find((peer) => peer.seat === seat);
  }
</script>

<section class="room-panel">
  <div class="room-panel-header">
    <small class="dimmed">P2P room</small>
    <small>{status}</small>
  </div>

  {#if linkDetected && mode === 'offline'}
    <p class="room-hint">Shared room detected from the URL. Pick a role and join.</p>
  {/if}

  {#if mode === 'host'}
    <div class="room-callout">
      <strong>{roomCode}</strong>
      {#if shareUrl}
        <input class="room-share" readonly value={shareUrl} />
      {/if}
    </div>
    <div class="room-actions">
      <button class="action" type="button" onclick={onCopyLink}>Copy link</button>
      <button class="action" type="button" onclick={onLeaveRoom}>Close room</button>
    </div>
    <div class="room-roster">
      {#each peers as peer (peer.peerId)}
        <div class="room-peer">
          <span>{peer.role === 'host' ? 'Host' : peer.role}</span>
          <span>{peer.seat || 'spectator'}</span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="room-join">
      <input
        class="room-code-input"
        placeholder="Room code"
        value={joinCode}
        oninput={(event) => onJoinCodeInput?.(event.currentTarget.value)}
      />
      <div class="room-role-picker">
        <button
          class="action"
          class:selected={requestedRole === 'player'}
          type="button"
          onclick={() => onRequestedRoleChange?.('player')}
        >Player</button>
        <button
          class="action"
          class:selected={requestedRole === 'spectator'}
          type="button"
          onclick={() => onRequestedRoleChange?.('spectator')}
        >Spectator</button>
      </div>
      {#if requestedRole === 'player'}
        <div class="room-seat-picker">
          {#each pendingPlayers.filter((seat) => seat !== 'p1') as seat (seat)}
            {@const occupant = getSeatOccupant(seat)}
            <button
              class="seat-chip"
              class:selected={selectedSeat === seat}
              class:busy={!!occupant}
              type="button"
              onclick={() => onSelectedSeatChange?.(seat)}
            >
              <span>{seat}</span>
              <small>{occupant ? occupant.role : 'open'}</small>
            </button>
          {/each}
        </div>
      {/if}
      <div class="room-actions">
        <button class="action" disabled={!canJoin} onclick={onJoinRoom}>Join room</button>
        <button class="action" disabled={!canCreate} onclick={onCreateRoom}>Create room</button>
      </div>
      {#if mode === 'guest'}
        <button class="link" type="button" onclick={onLeaveRoom}>Leave room</button>
      {/if}
    </div>
  {/if}

  {#if error}
    <p class="room-error">{error}</p>
  {/if}
</section>
