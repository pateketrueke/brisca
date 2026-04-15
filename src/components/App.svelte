<script>
  import { onMount } from 'svelte';
  import { Confetti } from 'svelte-confetti';

  import {
    EMPTY_GAME,
    BRISCA_PRIZE,
    BRISCA_VALUES,
    random,
    rotateAt,
    takeNth,
    chooseBotCard,
    getCardPoints,
    getBriscaDeck,
    isInvalidBrisca,
  } from '../lib/shared/helpers';

  import SvgIcon from './SvgIcon.svelte';
  import Dialog from './Dialog.svelte';
  import Card from './Card.svelte';

  // fix this later
  const VERSION = 'HEAD';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getVisibleGame(state) {
    return state.history?.[state.cursor] || state;
  }

  function withoutHistory(state) {
    const rest = { ...state };
    delete rest.history;
    delete rest.cursor;
    return rest;
  }

  /**
   * @param {any} card
   */
  function cardRef(card) {
    return card ? `${card.kind[0]}${card.number}` : null;
  }

  /**
   * @param {any[]} cards
   */
  function cardRefs(cards = []) {
    return cards.map(cardRef);
  }

  /**
   * @param {any} state
   * @param {string} name
   */
  function getTimelinePlayerPayload(state, name) {
    const user = state[name];
    /**
     * @type {any[]}
     */
    const stack = user.stack;
    return {
      name,
      bot: (state.bots || []).includes(name),
      hand: user.hand.length,
      set: cardRefs(user.set),
      stack: stack.length,
      score: stack.reduce((total, card) => total + getCardPoints(card), 0),
    };
  }

  /**
   * @param {any} state
   */
  function getTimelinePayload(state) {
    if (!state) return null;
    /**
     * @type {string[]}
     */
    const players = state.players || [];
    return {
      status: state.status,
      turn: state.turn,
      winner: state.winner,
      deck: state.deck?.length || 0,
      triumph: cardRef(state.triumph),
      players: players.map((name) => getTimelinePlayerPayload(state, name)),
    };
  }

  /**
   * @param {any} state
   */
  function getTimelineKey(state) {
    return JSON.stringify(getTimelinePayload(state));
  }

  let game = { ...EMPTY_GAME };
  try {
    if (localStorage.$game) {
      game = JSON.parse(localStorage.$game);
      game.status = game.status !== 'finished' ? game.status : 'pending';
      if (game.status !== 'pending' && !game.history) {
        game = { ...game, history: [clone(withoutHistory(game))], cursor: 0 };
      }
    }
  } catch {
    // ignore
  }

  $: viewGame = getVisibleGame(game);
  $: isReplaying =
    viewGame.status !== 'pending' && game.cursor < (game.history?.length || 0) - 1;
  $: remainingTurns =
    (viewGame.total -
      viewGame.players.reduce(
        (count, player) => count + viewGame[player].stack.length,
        0
      )) /
    viewGame.length;
  $: pendingPlay = viewGame.players.some((player) => !viewGame[player].set.length);
  $: allPlayed = viewGame.players.every((player) => viewGame[player].set.length > 0);
  $: pendingPlayers = Array.from(
    { length: Number(viewGame.length || 2) },
    (_, i) => `p${i + 1}`
  );
  $: timelineLength = game.history?.length || 0;
  $: timelineCursor = timelineLength ? game.cursor : 0;
  $: canScrubTimeline = timelineLength > 1;
  $: timelinePayload = timelineLength ? getTimelinePayload(viewGame) : null;
  $: timelinePayloadText = timelinePayload ? JSON.stringify(timelinePayload, null, 2) : '';

  /**
   * @type {any}
   */
  let timeout;

  /**
   * @type {any}
   */
  let customDialog = null;
  let botTimeout;
  let botCheckTimeout;
  let autoDialogTimeout;
  let autoDrawTimeout;
  let autoCheck = false;
  let showTimelineDebug = false;
  const isDebugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  try {
    autoCheck = localStorage.$autoCheck === 'true';
  } catch {
    // ignore
  }

  /**
   * @type {(callback: function) => void}
   */
  function closeDialog(callback) {
    clearTimeout(timeout);
    clearTimeout(autoDialogTimeout);
    customDialog = null;
    callback?.();
  }

  function shouldAutoAcceptDialog(props) {
    return autoCheck && !isReplaying && props.action === 'CONTINUE' && !props.confirm;
  }

  /**
   * @type {(props: any, callback: function) => void}
   */
  function setDialog(props, callback) {
    if (customDialog) {
      customDialog.reject();
    }
    clearTimeout(autoDialogTimeout);

    if (props.timeout) {
      timeout = setTimeout(() => closeDialog(callback), props.timeout);
    }

    if (!callback) {
      customDialog = { props };
    } else {
      new Promise((resolve, reject) => {
        const autoAccept = shouldAutoAcceptDialog(props);
        const dialog = {
          props: autoAccept ? { ...props, disabled: true } : props,
          resolved: false,
          resolve: () => {
            dialog.resolved = true;
            resolve(undefined);
          },
          reject,
        };
        customDialog = dialog;
        if (autoAccept) {
          autoDialogTimeout = setTimeout(dialog.resolve, 1000);
        }
      }).finally(() => {
        closeDialog(callback);
      });
    }

    return customDialog;
  }

  function syncGame(state) {
    let next = state;
    if (next.status === 'started' || next.status === 'finished') {
      const snapshot = clone(withoutHistory(next));
      const history =
        next.history?.slice(0, (next.cursor ?? next.history.length - 1) + 1) || [];
      const isDuplicate =
        getTimelineKey(history[history.length - 1]) === getTimelineKey(snapshot);
      const timeline = isDuplicate ? history : history.concat(snapshot);
      next = {
        ...next,
        history: timeline,
        cursor: timeline.length - 1,
      };
    }

    game = next;
    try {
      localStorage.setItem('$game', JSON.stringify(game));
    } catch {
      // ignore
    }
  }

  function normalizeBots(length = game.length, bots = game.bots || []) {
    const names = Array.from({ length: Number(length) }, (_, i) => `p${i + 1}`);
    return bots.filter((name) => name !== 'p1' && names.includes(name));
  }

  function isBot(name) {
    return (viewGame.bots || []).includes(name);
  }

  function hasBots() {
    return viewGame.players?.some((name) => isBot(name));
  }

  function toggleBot(name) {
    const bots = normalizeBots();
    game = {
      ...game,
      bots: bots.includes(name)
        ? bots.filter((bot) => bot !== name)
        : bots.concat(name).sort(),
    };
  }

  function updateLength() {
    game = { ...game, bots: normalizeBots() };
  }

  function updateAutoCheck() {
    try {
      localStorage.setItem('$autoCheck', String(autoCheck));
    } catch {
      // ignore
    }
  }

  function startGame() {
    const cardset = random(getBriscaDeck());

    if (game.length === '3') {
      takeNth(cardset, 1, (card) => card.number === 2);
    }

    const names = Array.from({ length: Number(game.length) }).map(
      (_, i) => `p${i + 1}`
    );
    const sorted = rotateAt(names, 'p1');
    const limited = cardset.length;
    const bots = normalizeBots(game.length);

    const users = sorted.reduce(
      (memo, cur) =>
        Object.assign(memo, {
          [cur]: { set: [], hand: takeNth(cardset, 3), stack: [] },
        }),
      {}
    );
    const triumph = takeNth(
      cardset,
      1,
      (card) => !(card.number in BRISCA_VALUES)
    )[0];

    syncGame({
      ...users,
      triumph,
      turn: 'p1',
      deck: cardset,
      bots,
      total: limited,
      players: names,
      ordered: sorted,
      length: game.length,
      status: 'started',
      start: Date.now(),
    });
  }

  let pending;
  function checkPlay() {
    if (isReplaying) return;

    let winner;
    game.ordered.forEach((player) => {
      const subset = game[player].set[0];
      if (!winner) {
        winner = { player, subset };
      } else if (subset.kind === winner.subset.kind) {
        const a = BRISCA_VALUES[subset.number] || 0;
        const b = BRISCA_VALUES[winner.subset.number] || 0;

        // VALUE vs VALUE
        if (a && b) {
          if (a > b) winner = { player, subset };
        }

        // VALUE vs NUMBER
        if (a && !b) {
          winner = { player, subset };
        }

        // NUMBER vs NUMBER
        if (!b && !a) {
          if (subset.number > winner.subset.number) winner = { player, subset };
        }
      } else if (subset.kind === game.triumph.kind) {
        winner = { player, subset };
      }
    });

    if (game.deck.length === game.length - 1) {
      game.deck.push(game.triumph);
    }

    const sorted = rotateAt(game.players, winner.player);
    const stack = game.players.reduce(
      (memo, player) => memo.concat(game[player].set),
      []
    );
    const users = sorted.reduce(
      (memo, player) =>
        Object.assign(memo, {
          [player]: {
            ...game[player],
            played: undefined,
            set: [],
            hand: game[player].hand.concat(game.deck.splice(0, 1)),
            stack: game[player].stack.concat(
              player === winner.player ? stack : []
            ),
          },
        }),
      {}
    );

    if (!game.deck.length && remainingTurns === 1) {
      const scores = sorted
        .reduce(
          (memo, player) =>
            memo.concat({
              name: player,
              score: users[player].stack.reduce(
                (total, card) => total + (BRISCA_VALUES[card.number] || 0),
                0
              ),
            }),
          []
        )
        .sort((a, b) => b.score - a.score);

      syncGame({
        ...game,
        ...users,
        status: 'finished',
        winner: scores[0].name,
      });

      pending = setDialog(
        {
          icon: 'at',
          action: 'CLOSE',
          message: `${scores[0].name} won the game!`,
          description: `${scores.map((player, i) => `${BRISCA_PRIZE[i]} @${player.name} scored ${player.score} points`).join(', <br />')}`,
        },
        () => {
          pending = undefined;
          syncGame({ ...EMPTY_GAME });
        }
      );
      return;
    }

    syncGame({ ...game, winner: winner.player });
    pending = setDialog(
      {
        icon: 'at',
        message: `${winner.player} won this hand!`,
        action: 'CONTINUE',
      },
      () => {
        pending = undefined;
        syncGame({
          ...game,
          ...users,
          ordered: sorted,
          turn: winner.player,
          winner: winner.player,
        });
        setDialog({
          icon: 'at',
          message: `${winner.player} opens the game`,
          timeout: 1000,
        });
      }
    );
  }

  let canceling;
  function cancelGame() {
    canceling = true;
    pending = setDialog(
      {
        confirm: 'Do you want to end this game?',
        continue: 'EXIT GAME',
      },
      () => {
        if (pending.resolved) {
          syncGame({ ...EMPTY_GAME });
        }
        pending = undefined;
        canceling = undefined;
      }
    );
  }

  let player;
  let cards = [];
  let selected = -1;
  function drawCards() {
    if (isReplaying || isBot(game.turn)) return;
    player = game.turn;
    cards = game[player].hand;
  }

  function playCard(name, card) {
    if (isReplaying) return;

    const offset = game.players.findIndex((x) => name === x);
    const next = (offset + 1) % game.players.length;
    const hand = game[name].hand.slice();
    const idx = hand.findIndex((x) => x === card);
    const set = hand.splice(idx, 1);

    syncGame({
      ...game,
      turn: game.players[next],
      [name]: {
        ...game[name],
        hand,
        played: true,
        set,
      },
    });

    if (player === name) {
      cards = [];
      selected = -1;
      player = undefined;
    }
  }

  function chooseIt(card) {
    playCard(player, card);
  }

  function isInvalid(card) {
    if (!game.deck.length && game.turn !== game.winner) {
      return isInvalidBrisca(
        cards,
        card,
        game[game.winner].set[0],
        game.triumph
      );
    }
  }

  function playBotTurn() {
    if (
      customDialog ||
      player ||
      isReplaying ||
      game.status !== 'started' ||
      allPlayed ||
      !isBot(game.turn) ||
      game[game.turn]?.played
    ) {
      return;
    }

    const card = chooseBotCard(game, game.turn);
    if (card) playCard(game.turn, card);
  }

  $: if (
    game.status === 'started' &&
    pendingPlay &&
    isBot(game.turn) &&
    !player &&
    !customDialog &&
    !isReplaying
  ) {
    clearTimeout(botTimeout);
    botTimeout = setTimeout(playBotTurn, 350);
  }

  $: if (
    game.status === 'started' &&
    autoCheck &&
    pendingPlay &&
    !isBot(game.turn) &&
    !game[game.turn]?.played &&
    !player &&
    !customDialog &&
    !isReplaying
  ) {
    clearTimeout(autoDrawTimeout);
    autoDrawTimeout = setTimeout(drawCards, 350);
  }

  $: if (
    game.status === 'started' &&
    allPlayed &&
    (autoCheck || hasBots()) &&
    !player &&
    !customDialog &&
    !isReplaying
  ) {
    clearTimeout(botCheckTimeout);
    botCheckTimeout = setTimeout(checkPlay, 500);
  }

  function setHistoryCursor(value) {
    player = undefined;
    cards = [];
    selected = -1;
    clearTimeout(botTimeout);
    clearTimeout(botCheckTimeout);
    clearTimeout(autoDrawTimeout);
    game = { ...game, cursor: Number(value) };
  }

  onMount(() => {
    function handleKeys(e) {
      if (player) {
        let offset = selected;
        if (e.keyCode === 37) {
          e.preventDefault();
          if (offset === -1) offset = 0;
          else offset = offset <= 0 ? cards.length - 1 : offset - 1;
        }
        if (e.keyCode === 39) {
          e.preventDefault();
          if (offset === -1) offset = cards.length - 1;
          else offset = offset < cards.length - 1 ? offset + 1 : 0;
        }
        if (e.keyCode === 9) {
          e.preventDefault();
          if (e.shiftKey) {
            offset = offset <= 0 ? cards.length - 1 : offset - 1;
          } else {
            offset = offset < cards.length - 1 ? offset + 1 : 0;
          }
        }
        if (offset !== selected) {
          if (!cards[offset] || isInvalid(cards[offset])) {
            selected = cards.findIndex((x) => !isInvalid(x));
          } else {
            selected = offset;
          }
        }
      }
    }

    function handleDialogs(e) {
      if (player) {
        if (e.keyCode === 13 && selected !== -1) {
          e.preventDefault();
          chooseIt(cards[selected]);
        }
      } else if (e.keyCode === 27) {
        if (pending) pending.reject();
      } else if (e.keyCode === 13) {
        e.preventDefault();
        if (pending) pending.resolve();
        else if (viewGame.status === 'pending') startGame();
        else if (viewGame.status === 'started' && !isReplaying) {
          if (pendingPlay) drawCards();
          else if (allPlayed) checkPlay();
        }
      }
    }

    addEventListener('keydown', handleKeys);
    addEventListener('keyup', handleDialogs);
    return () => {
      removeEventListener('keydown', handleKeys);
      removeEventListener('keyup', handleDialogs);
      clearTimeout(botTimeout);
      clearTimeout(botCheckTimeout);
      clearTimeout(autoDialogTimeout);
      clearTimeout(autoDrawTimeout);
    };
  });
</script>

<div id="app">
<header>
  <h1>Brisca <small>{VERSION}</small></h1>
  <span class="header-controls">
    {#if viewGame.status === 'started'}
      <button
        class="link"
        tabindex="-1"
        disabled={canceling || isReplaying}
        on:click={cancelGame}>Exit</button
      >
    {:else}
      <small class="dimmed">Players:</small>
      <select
        class="action"
        bind:value={game.length}
        disabled={viewGame.status !== 'pending'}
        on:change={updateLength}
      >
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </select>
      <span class="seat-controls">
        {#each pendingPlayers as name (name)}
          <label class="seat-control" class:dimmed={name === 'p1'}>
            <span>{name}</span>
            <select
              class="action"
              disabled={name === 'p1'}
              value={isBot(name) ? 'bot' : 'human'}
              on:change={() => toggleBot(name)}
            >
              <option value="human">Human</option>
              <option value="bot">Bot</option>
            </select>
          </label>
        {/each}
      </span>
    {/if}
  </span>
</header>

<div class="game-board">
  <span class="pot" data-board-pot>
    <Card type="deck" number={viewGame.deck.length}>
      {#if viewGame.triumph}<Card value={viewGame.triumph} />{/if}
    </Card>
  </span>

  {#if viewGame.status === 'started'}
    <ul data-players>
      {#each viewGame.players as name (name)}
        <li class="player" class:active={viewGame.turn === name && !viewGame[name].played}>
          <div class="player-header">
            <button
                class="action"
                tabindex="-1"
                disabled={isReplaying || viewGame.turn !== name || viewGame[name].played || (autoCheck && !isBot(name))}
                on:click={drawCards}
            >
                <SvgIcon name="at" size="14" />
                <span class="player-name">{name}</span>
                <span class="icons flex">
                    {#if name === viewGame.winner}
                    <SvgIcon name="star" fill="gold" />
                    {/if}
                    {#if isBot(name)}
                    <SvgIcon name="robot"/>
                    {/if}
                </span>
            </button>
            <span class="player-score">{viewGame[name].stack.length} cards</span>
          </div>
          <div class="player-cards">
            {#each viewGame[name].set as card (`${card.kind}:${card.number}`)}
                <Card value={card} />
            {/each}
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  <span class="board-action">
    {#if viewGame.status === 'pending'}
      <button class="action" on:click={startGame} tabindex="-1">
        <SvgIcon name="enter" />
        START
      </button>
    {/if}

    {#if viewGame.status === 'started'}
      <span class="commit-controls">
        <button
          class="action flex space"
          on:click={checkPlay}
          tabindex="-1"
          disabled={isReplaying || autoCheck || !viewGame.players.every((x) => viewGame[x].played)}
        >
          <SvgIcon name="enter" />
          OK
        </button>
        <label class="auto-check flex center space">
          <input
            aria-label="Auto OK"
            type="checkbox"
            bind:checked={autoCheck}
            disabled={isReplaying}
            on:change={updateAutoCheck}
          />
          <small>Auto OK</small>
        </label>
      </span>
    {/if}
  </span>
</div>

{#if viewGame.status === 'started' && remainingTurns > 0}
  <small class="flex space center dimmed">
    <SvgIcon name="repeat" size="12" />
    <em>{remainingTurns} turns left</em>
  </small>
{/if}

{#if isDebugMode}
<div class="timeline">
  <label class="flex space center">
    <small class:dimmed={!isReplaying}>
      {#if timelineLength}
        {isReplaying ? 'Replay' : 'Live'} {timelineCursor + 1}/{timelineLength}
      {:else}
        Empty 0/0
      {/if}
    </small>
    <input
      aria-label="Gameplay timeline"
      type="range"
      min="0"
      max={Math.max(timelineLength - 1, 0)}
      value={timelineCursor}
      disabled={!canScrubTimeline}
      on:input={(event) => setHistoryCursor(event.currentTarget.value)}
    />
  </label>
  <label class="timeline-debug-toggle flex center space">
    <input
      aria-label="Inspect timeline payload"
      type="checkbox"
      bind:checked={showTimelineDebug}
      disabled={!timelineLength}
    />
    <small>Payload</small>
  </label>
  {#if showTimelineDebug && timelinePayloadText}
    <pre class="timeline-debug" aria-label="Timeline payload">{timelinePayloadText}</pre>
  {/if}
</div>
{/if}

<Dialog hidden={!cards.length}>
  <div>
    {#if cards.length}
      <h3 class="flex reset center">
        <SvgIcon name="at" />
        {player}'s turn:
      </h3>
      <div class="card-picker">
        {#each cards as card, o (`${card.kind}:${card.number}`)}
          <Card
            onClick={() => chooseIt(card)}
            disabled={isInvalid(card)}
            focused={o === selected}
            type="button"
            value={card}
          />
        {/each}
      </div>
      <label class="auto-check flex center space" style="justify-content: center; margin-top: 12px;">
        <input
          type="checkbox"
          bind:checked={autoCheck}
          on:change={updateAutoCheck}
        />
        <small>Auto OK</small>
      </label>
    {:else}
      Loading...
    {/if}
  </div>
</Dialog>

{#if customDialog}
  <Dialog
      attributes={customDialog.props}
      onConfirm={customDialog.resolve}
      onAction={customDialog.resolve}
      onCancel={customDialog.reject}
    />
{/if}

{#if viewGame.status === 'finished'}
  <div class="confetti">
    <Confetti
      x={[-5, 5]}
      y={[0, 0.1]}
      delay={[500, 2000]}
      infinite
      duration={5000}
      amount={200}
      fallDistance="100vh"
    />
  </div>
{/if}
</div>
