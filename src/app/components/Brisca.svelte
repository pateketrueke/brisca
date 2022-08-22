<script>
  import { onMount } from 'svelte';
  import { Confetti } from 'svelte-confetti';

  import { setDialog } from '~/src/app/shared/dialog';

  import {
    EMPTY_GAME, BRISCA_PRIZE, BRISCA_VALUES,
    random, rotateAt, takeNth, getBriscaDeck, isInvalidBrisca,
  } from '~/src/app/shared/helpers';

  import SvgIcon from './SvgIcon.svelte';
  import Dialog from './Dialog.svelte';
  import Card from './Card.svelte';

  const VERSION = process.env.SOURCE_VERSION
    ? process.env.SOURCE_VERSION.substr(0, 7)
    : 'HEAD';

  let game = { ...EMPTY_GAME };
  try {
    if (localStorage.$game) {
      game = JSON.parse(localStorage.$game);
      game.status = game.status !== 'finished'
        ? game.status
        : 'pending';
    }
  } catch (e) {
    // ignore
  }

  $: remainingTurns = (game.total - game.players.reduce((count, player) => count + game[player].stack.length, 0)) / game.length;
  $: pendingPlay = game.players.some(player => !game[player].set.length);
  $: allPlayed = game.players.every(player => game[player].set.length > 0);

  function syncGame(state) {
    game = state;
    try {
      localStorage.setItem('$game', JSON.stringify(game));
    } catch (e) {
      // ignore
    }
  }

  function startGame() {
    const cardset = random(getBriscaDeck());

    if (game.length === '3') {
      takeNth(cardset, 1, card => card.number === 2);
    }

    const names = Array.from({ length: game.length }).map((_, i) => `p${i + 1}`);
    const sorted = rotateAt(names, 'p1');
    const limited = cardset.length;

    const users = sorted.reduce((memo, cur) => Object.assign(memo, {
      [cur]: { set: [], hand: takeNth(cardset, 3), stack: [] },
    }), {});
    const triumph = takeNth(cardset, 1, card => !(card.number in BRISCA_VALUES))[0];

    syncGame({
      ...users,
      triumph,
      turn: 'p1',
      deck: cardset,
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
    let winner;
    game.ordered.forEach(player => {
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
    const stack = game.players.reduce((memo, player) => memo.concat(game[player].set), []);
    const users = sorted.reduce((memo, player) => Object.assign(memo, {
      [player]: {
        ...game[player],
        played: undefined,
        set: [],
        hand: game[player].hand.concat(game.deck.splice(0, 1)),
        stack: game[player].stack.concat(player === winner.player ? stack : []),
      },
    }), {});

    if (!game.deck.length && remainingTurns === 1) {
      const scores = sorted.reduce((memo, player) => memo.concat({
        name: player,
        score: users[player].stack.reduce((total, card) => total + (BRISCA_VALUES[card.number] || 0), 0),
      }), []).sort((a, b) => b.score - a.score);

      syncGame({
        ...game,
        ...users,
        status: 'finished',
        winner: scores[0].name,
      });

      pending = setDialog({
        icon: 'at',
        action: 'CLOSE',
        message: `${scores[0].name} won the game!`,
        description: `${scores.map((player, i) => `${BRISCA_PRIZE[i]} @${player.name} scored ${player.score} points`).join(', <br />')}`,
      }, () => {
        pending = undefined;
        syncGame({ ...EMPTY_GAME });
      });
      return;
    }

    syncGame({ ...game, winner: winner.player });
    pending = setDialog({
      icon: 'at',
      message: `${winner.player} won this hand!`,
      action: 'CONTINUE',
    }, () => {
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
    });
  }

  let canceling;
  function cancelGame() {
    canceling = true;
    pending = setDialog({
      confirm: 'Do you want to end this game?',
      continue: 'EXIT GAME',
    }, () => {
      if (pending.resolved) {
        syncGame({ ...EMPTY_GAME });
      }
      pending = undefined;
      canceling = undefined;
    });
  }

  let player;
  let cards = [];
  let selected = -1;
  function drawCards() {
    player = game.turn;
    cards = game[player].hand;
  }

  function chooseIt(card) {
    const offset = game.players.findIndex(x => player === x);
    const next = (offset + 1) % game.players.length;
    const idx = cards.findIndex(x => x === card);
    const set = cards.splice(idx, 1);

    syncGame({
      ...game,
      turn: game.players[next],
      [player]: {
        ...game[player],
        played: true,
        set,
      },
    });

    cards = [];
    selected = -1;
    player = undefined;
  }

  function isInvalid(card) {
    if (!game.deck.length && game.turn !== game.winner) {
      return isInvalidBrisca(cards, card, game[game.winner].set[0], game.triumph);
    }
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
            selected = cards.findIndex(x => !isInvalid(x));
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
        else if (game.status === 'pending') startGame();
        else if (game.status === 'started') {
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
    };
  });
</script>

<header class="flex space center apart">
  <h1 class="reset">Brisca <small>{VERSION}</small></h1>
  <span>
    {#if game.status === 'started'}
      <button class="link" tabindex="-1" disabled={canceling} on:click={cancelGame}>Exit game</button>
    {:else}
      <small class="dimmed">Players:</small>
      <select class="action" bind:value={game.length} disabled="{game.status !== 'pending'}">
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </select>
    {/if}
  </span>
</header>

<div class="full flex apart">
  <span class="pot">
    <Card type="deck" number={game.deck.length}>
      {#if game.triumph}<Card value={game.triumph} />{/if}
    </Card>
  </span>

  {#if game.status === 'started'}
    <ul data-players class="flex wrapped justify inline reset">
      {#each game.players as name}
        <li class="player">
          <span class="icons space v-flex">
            {#if name === game.winner}
              <SvgIcon name="star" fill="gold" />
            {/if}
            <!--
            <svg width="16" height="16">
              <use xlink:href="#icon-gear" />
            </svg>
            <svg width="16" height="16">
              <use xlink:href="#icon-warn" />
            </svg>
            <svg width="16" height="16">
              <use xlink:href="#icon-nobell" />
            </svg>
            -->
          </span>
          <button class="action flex center" tabindex="-1" disabled="{game.turn !== name || game[name].played}" title="{game[name].stack.length} cards" on:click={drawCards}>
            <SvgIcon name="at" size="12" />
            {name}
          </button>
          {#each game[name].set as card}
            <Card value={card} />
          {/each}
        </li>
      {/each}
    </ul>
  {/if}

  <span>
    {#if game.status === 'pending'}
      <button class="action flex space" on:click={startGame} tabindex="-1">
        <SvgIcon name="enter" />
        START
      </button>
    {/if}

    {#if game.status === 'started'}
      <button class="action flex space" on:click={checkPlay} tabindex="-1" disabled="{!game.players.every(x => game[x].played)}">
        <SvgIcon name="enter" />
        OK
      </button>
    {/if}
  </span>
</div>

{#if game.status === 'started' && remainingTurns > 0}
  <small class="flex space center dimmed">
    <SvgIcon name="repeat" size="12" />
    <em>{remainingTurns} turns left</em>
  </small>
{/if}

<Dialog hidden={!cards.length}>
  <div>
    {#if cards.length}
      <h3 class="flex reset center">
        <SvgIcon name="at" />
        {player}'s turn:
      </h3>
      <span class="flex space justify">
        {#each cards as card, o}
          <Card disabled={isInvalid(card)} focused="{o === selected}" type="button" value={card} on:click="{() => chooseIt(card)}" />
        {/each}
      </span>
    {:else}
      Loading...
    {/if}
  </div>
</Dialog>

{#if game.status === 'finished'}
  <div class="confetti">
    <Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]} infinite duration=5000 amount=200 fallDistance="100vh" />
  </div>
{/if}
