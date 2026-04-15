<script>
  import { onMount } from 'svelte';
  import { Confetti } from 'svelte-confetti';
  import BriscaIcon from '../lib/assets/brisca.svg?raw';

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
    getLang,
    setLang,
    t,
    getTeam,
    getTeammate,
    getTeamScore,
    isTeamGame,
  } from '../lib/shared/helpers';

  import SvgIcon from './SvgIcon.svelte';
  import Dialog from './Dialog.svelte';
  import Card from './Card.svelte';

  const VERSION = 'HEAD';

  // i18n
  let lang = getLang();
  $: i18n = t(lang);

  function toggleLang() {
    lang = lang === 'en' ? 'es' : 'en';
    setLang(lang);
  }

  // theme
  function getTheme() {
    try { if (localStorage.$theme) return localStorage.$theme; } catch { /* ignore */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  let theme = 'light';
  onMount(() => { theme = getTheme(); });
  $: if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('$theme', theme); } catch { /* ignore */ }
  }

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
  $: currentBots = viewGame.bots || [];
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

  // Player display names (separate from internal IDs)
  let playerNames = {};
  try {
    autoCheck = localStorage.$autoCheck === 'true';
    playerNames = JSON.parse(localStorage.$names || '{}');
  } catch {
    // ignore
  }

  let showRules = false;
  let inlinePicker = false;
  let peekingTeammate = false; // showing teammate's cards in picker

  function canPeekTeammate(playerName) {
    return isTeamGame(viewGame)
      && viewGame.deck.length === 0
      && viewGame.turn === playerName
      && !viewGame[playerName]?.played
      && !peekingTeammate
      && !!getTeammate(playerName);
  }

  function peekTeammate() {
    peekingTeammate = true;
  }

  function returnCards() {
    peekingTeammate = false;
  }
  let toast = null;
  let toastTimeout;

  function showToast(message) {
    clearTimeout(toastTimeout);
    toast = message;
    toastTimeout = setTimeout(() => { toast = null; }, 2200);
  }

  onMount(() => {
    const mq = window.matchMedia('(min-width: 720px)');
    inlinePicker = mq.matches;
    mq.addEventListener('change', e => { inlinePicker = e.matches; });
  });

  $: defaultNames = i18n.defaultNames;
  function getDisplayName(id) {
    return playerNames[id] || defaultNames[id] || id;
  }
  function setDisplayName(id, name) {
    playerNames = { ...playerNames, [id]: name || defaultNames[id] || id };
    try { localStorage.setItem('$names', JSON.stringify(playerNames)); } catch { /* ignore */ }
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
      const finishedGame = { ...game, ...users, status: 'finished' };

      let message, description, winnerName;

      if (isTeamGame(game)) {
        const t1 = getTeamScore(finishedGame, 1);
        const t2 = getTeamScore(finishedGame, 2);
        const winningTeam = t1 >= t2 ? 1 : 2;
        winnerName = winner.player;

        message = i18n.teamWins(winningTeam);
        const scores = sorted.map(p => ({
          name: p,
          score: users[p].stack.reduce((s, c) => s + (BRISCA_VALUES[c.number] || 0), 0),
          team: getTeam(p),
        })).sort((a, b) => b.score - a.score);
        description = [
          `${i18n.team(1)}: ${t1} pts — ${i18n.team(2)}: ${t2} pts`,
          ...scores.map((p, i) => `${BRISCA_PRIZE[i]} ${getDisplayName(p.name)} (${i18n.team(p.team)}) — ${p.score} pts`),
        ].join('<br />');
      } else {
        const scores = sorted
          .map(player => ({
            name: player,
            score: users[player].stack.reduce((total, card) => total + (BRISCA_VALUES[card.number] || 0), 0),
          }))
          .sort((a, b) => b.score - a.score);
        winnerName = scores[0].name;
        message = i18n.winsGame(getDisplayName(winnerName));
        description = scores.map((p, i) => `${BRISCA_PRIZE[i]} ${getDisplayName(p.name)} — ${i18n.scored(getDisplayName(p.name), p.score)}`).join('<br />');
      }

      syncGame({ ...finishedGame, winner: winnerName });

      pending = setDialog(
        { icon: 'at', action: i18n.ok, message, description },
        () => {
          pending = undefined;
          syncGame({ ...EMPTY_GAME });
        }
      );
      return;
    }

    syncGame({ ...game, winner: winner.player });

    if (autoCheck) {
      showToast(i18n.winsHand(getDisplayName(winner.player)));
      syncGame({
        ...game,
        ...users,
        ordered: sorted,
        turn: winner.player,
        winner: winner.player,
      });
    } else {
      pending = setDialog(
        {
          icon: 'at',
          message: i18n.winsHand(getDisplayName(winner.player)),
          action: i18n.ok,
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
            message: i18n.opensGame(getDisplayName(winner.player)),
            timeout: 1000,
          });
        }
      );
    }
  }

  let canceling;
  function cancelGame() {
    canceling = true;
    pending = setDialog(
      {
        confirm: i18n.exitConfirm,
        cancel: i18n.cancel,
        continue: i18n.exit,
        or: i18n.or,
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
      peekingTeammate = false;
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
    !isReplaying &&
    !canPeekTeammate(game.turn)
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
  <h1 title="{i18n.title}">
    <a href="/">
      <span class="logo">{@html BriscaIcon}</span>
    </a>
    <small>{VERSION}</small>
  </h1>
  <span class="header-controls">
    {#if viewGame.status === 'started'}
      <button
        class="link"
        tabindex="-1"
        disabled={canceling || isReplaying}
        on:click={cancelGame}>{i18n.exit}</button>
    {/if}
    /
    <button class="link" tabindex="-1" on:click={toggleLang}>
      {lang === 'en' ? 'ES' : 'EN'}
    </button>
    /
    <button class="link" tabindex="-1" on:click={toggleTheme}>
      {theme === 'dark' ? '☀︎' : '☽'}
    </button>
  </span>
</header>

{#if viewGame.status === 'pending'}
  <div class="setup">
    <div class="player-count-picker">
      <small class="dimmed">{i18n.players}</small>
      <div class="count-tiles">
        {#each ['2','3','4'] as n}
          <button
            class="count-tile"
            class:selected={game.length === n}
            on:click={() => { game.length = n; updateLength(); }}
          >{n}</button>
        {/each}
      </div>
    </div>
    <div class="seat-list">
      {#each pendingPlayers as id (id)}
        <div class="seat" class:dimmed={false}>
          <input
            class="seat-name"
            type="text"
            value={getDisplayName(id)}
            placeholder={defaultNames[id] || id}
            on:change={e => setDisplayName(id, e.currentTarget.value)}
            readonly={id === 'p1' ? false : false}
          />
          <button
            class="seat-type"
            class:is-bot={currentBots.includes(id)}
            disabled={id === 'p1'}
            on:click={() => toggleBot(id)}
            title={currentBots.includes(id) ? i18n.bot : i18n.human}
          >
            {#if currentBots.includes(id)}<SvgIcon name="robot" />{:else}<SvgIcon name="at" />{/if}
          </button>
        </div>
      {/each}
    </div>
    <button class="deal-btn action" on:click={startGame} tabindex="-1">
      <SvgIcon name="enter" />
      {i18n.deal}
    </button>
    <button class="link" on:click={() => showRules = true} tabindex="-1">
      {i18n.howToPlay}
    </button>
  </div>
{/if}

{#if showRules}
  <div class="overlay shown" on:click|self={() => showRules = false}>
    <div class="rules-panel">
      <button class="rules-close link" on:click={() => showRules = false}>✕</button>
      <h2>{i18n.rules.title}</h2>
      <p>{i18n.rules.intro}</p>
      <p>{i18n.rules.deck}</p>
      <p><strong>{i18n.rules.values}</strong></p>
      <table class="rules-table">
        {#each i18n.rules.valueRows as [card, pts]}
          <tr><td>{card}</td><td>{pts}</td></tr>
        {/each}
      </table>
      <p>{i18n.rules.triumph}</p>
      <p>{i18n.rules.turn}</p>
      <p>{i18n.rules.draw}</p>
      <p>{i18n.rules.lastRound}</p>
      <p><strong>{i18n.rules.winning}</strong></p>
    </div>
  </div>
{/if}

<div class="game-board">
  {#if viewGame.status === 'started'}
    <div class="table-center" data-board-pot>
      <div class="felt">
        <div class="felt-deck">
          <Card type="deck" number={viewGame.deck.length}>
            {#if viewGame.triumph}
              <span class="card triumph-card"
                data-cardset="{viewGame.triumph.kind}:{viewGame.triumph.number}"
                title="{viewGame.triumph.number} of {viewGame.triumph.kind}"
              >
                <sub>{viewGame.triumph.number}</sub>
                <small>{viewGame.triumph.kind}</small>
                <sup>{viewGame.triumph.number}</sup>
              </span>
            {/if}
          </Card>
        </div>
      </div>
    </div>

    <ul data-players>
      {#each viewGame.players as name (name)}
        <li class="player flex" class:active={viewGame.turn === name && !viewGame[name].played}>
          <div class="player-header">
            <button
                class="action"
                tabindex="-1"
                disabled={isReplaying || viewGame.turn !== name || viewGame[name].played || (autoCheck && !isBot(name))}
                on:click={drawCards}
            >
                <span class="player-name">{getDisplayName(name)}</span>
                <span class="icons flex">
                    {#if name === viewGame.winner}<SvgIcon name="star" fill="gold" />{/if}
                    {#if isBot(name)}<SvgIcon name="robot"/>{/if}
                </span>
            </button>
            <span class="player-score">
              {viewGame[name].stack.reduce((s, c) => s + (BRISCA_VALUES[c.number] || 0), 0)} pts
            </span>
            {#if isTeamGame(viewGame)}
              <span class="team-badge" data-team={getTeam(name)}>{i18n.team(getTeam(name))}</span>
            {/if}
          </div>
          <div class="player-cards">
            {#each viewGame[name].set as card (`${card.kind}:${card.number}`)}
                <Card value={card} />
            {/each}
          </div>
          {#if inlinePicker && cards.length && player === name}
            <div class="inline-picker">
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
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#if viewGame.status === 'started' && isTeamGame(viewGame)}
  <div class="team-scores">
    {#each [1, 2] as team}
      <span class="team-score" data-team={team}>
        {i18n.team(team)}: {getTeamScore(viewGame, team)} pts
      </span>
    {/each}
  </div>
{/if}

{#if viewGame.status === 'started' && remainingTurns > 0}
  <span class="board-action">
    <small class="flex space center dimmed">
      <SvgIcon name="repeat" size="12" />
      <em>{i18n.turnsLeft(remainingTurns)}</em>
    </small>
    <span class="commit-controls">
      <button
        class="action flex space"
        on:click={checkPlay}
        tabindex="-1"
        disabled={isReplaying || autoCheck || !viewGame.players.every((x) => viewGame[x].played)}
      >
        <SvgIcon name="enter" />
        {i18n.ok}
      </button>
      <label class="auto-check flex center space">
        <input
          aria-label="Auto OK"
          type="checkbox"
          bind:checked={autoCheck}
          disabled={isReplaying}
          on:change={updateAutoCheck}
        />
        <small>{i18n.autoOk}</small>
      </label>
    </span>
  </span>
{/if}

{#if isDebugMode}
<div class="timeline">
  <label class="flex space center">
    <small class:dimmed={!isReplaying}>
      {#if timelineLength}
        {isReplaying ? 'Replay' : 'Live'} {timelineCursor + 1}/{timelineLength}
      {:else}
        {i18n.empty} 0/0
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

<Dialog hidden={!cards.length || inlinePicker}>
  <div>
    {#if cards.length}
      {#if peekingTeammate && player && getTeammate(player)}
        <h3 class="flex reset center">
          {i18n.teamPeek} — {getDisplayName(getTeammate(player))}
        </h3>
        <div class="card-picker">
          {#each (viewGame[getTeammate(player)]?.hand || []) as card (`${card.kind}:${card.number}`)}
            <Card value={card} />
          {/each}
        </div>
        <button class="action" style="width:100%; justify-content: center; margin-top: 12px;" on:click={returnCards}>
          {i18n.teamReturn}
        </button>
      {:else}
        <h3 class="flex reset center">
          <SvgIcon name="at" />
          {getDisplayName(player)} — {i18n.yourTurn}
        </h3>
        {#if canPeekTeammate(player)}
          <button class="team-peek-btn link" on:click={peekTeammate}>
            👀 {i18n.teamPeek}
          </button>
        {/if}
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
          <input type="checkbox" bind:checked={autoCheck} on:change={updateAutoCheck} />
          <small>{i18n.autoOk}</small>
        </label>
      {/if}
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

{#if toast}
  <div class="toast" role="status">{toast}</div>
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
