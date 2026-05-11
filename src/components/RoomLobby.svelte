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
    i18n = {},
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

  function seatLabel(seat) {
    return i18n.seat?.(seat.slice(1)) ?? `Seat ${seat.slice(1)}`;
  }
</script>

<section class="room-panel">
  <div class="room-panel-header">
    <small class="dimmed">{i18n.label ?? 'Online room'}</small>
    <span class="room-status-dot" data-status={status} title={status}></span>
  </div>

  {#if linkDetected && mode === 'offline'}
    <p class="room-hint">{i18n.linkHint ?? 'Room link detected — pick a role and join.'}</p>
  {/if}

  {#if mode === 'host'}
    <div class="room-callout">
      <div class="room-code-badge">{roomCode}</div>
      {#if shareUrl}
        <div class="room-share-row">
          <span class="room-share-url">{shareUrl}</span>
          <button class="action room-copy-btn" type="button" onclick={onCopyLink}>{i18n.copy ?? 'Copy'}</button>
        </div>
      {/if}
    </div>
    <div class="room-actions">
      <button class="action" type="button" onclick={onLeaveRoom}>{i18n.closeRoom ?? 'Close room'}</button>
    </div>
    {#if peers.length > 0}
      <div class="room-roster">
        {#each peers as peer (peer.peerId)}
          <div class="room-peer">
            <span class="room-peer-role" data-role={peer.role}>
              {i18n.roles?.[peer.role] ?? peer.role}
            </span>
            <span class="room-peer-seat">{peer.seat ? seatLabel(peer.seat) : '—'}</span>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="room-join">
      <input
        class="room-code-input"
        placeholder={i18n.codePlaceholder ?? 'Paste room code'}
        value={joinCode}
        oninput={(event) => onJoinCodeInput?.(event.currentTarget.value)}
      />
      <div class="room-actions">
        <button
          class="action"
          class:selected={requestedRole === 'player'}
          type="button"
          onclick={() => onRequestedRoleChange?.('player')}
        >{i18n.rolePlayer ?? 'Player'}</button>
        <button
          class="action"
          class:selected={requestedRole === 'spectator'}
          type="button"
          onclick={() => onRequestedRoleChange?.('spectator')}
        >{i18n.roleSpectator ?? 'Spectator'}</button>
      </div>
      {#if requestedRole === 'player'}
        <div class="room-seat-picker">
          {#each pendingPlayers.filter((seat) => seat !== 'p1') as seat (seat)}
            {@const occupant = getSeatOccupant(seat)}
            <button
              class="seat-chip"
              class:selected={selectedSeat === seat}
              class:busy={!!occupant}
              disabled={!!occupant}
              type="button"
              onclick={() => onSelectedSeatChange?.(seat)}
            >
              <span>{seatLabel(seat)}</span>
              <small>{occupant ? (i18n.taken ?? 'taken') : (i18n.open ?? 'open')}</small>
            </button>
          {/each}
        </div>
      {/if}
      <div class="room-actions">
        {#if canJoin}
          <button class="action selected" onclick={onJoinRoom}>{i18n.joinRoom ?? 'Join room'}</button>
        {/if}
        {#if canCreate}
          <button class="action" onclick={onCreateRoom}>{i18n.createRoom ?? 'Create room'}</button>
        {/if}
      </div>
      {#if mode === 'guest'}
        <button class="link" type="button" onclick={onLeaveRoom}>{i18n.leaveRoom ?? 'Leave room'}</button>
      {/if}
    </div>
  {/if}

  {#if error}
    <p class="room-error">{error}</p>
  {/if}
</section>
