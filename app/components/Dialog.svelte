<script>
  import { createEventDispatcher } from 'svelte';

  import SvgIcon from './SvgIcon.svelte';

  const dispatch = createEventDispatcher();

  export let attributes = {};
  export let component;
  export let hidden;
</script>

<div class="overlay" class:shown="{hidden === false}">
  {#if component}
    <svelte:component this={component} {...attributes} on:cancel on:action on:confirm />
  {:else if attributes.message}
    <div>
      <h3 class="reset flex center" class:space={attributes.gap}>
        {#if attributes.icon}
          <SvgIcon name={attributes.icon} />
        {/if}
        {attributes.message}
      </h3>
      {#if attributes.description}<p>{@html attributes.description}</p>{/if}
      {#if !attributes.timeout}
        <div class="flex justify">
          <button class="action flex space" on:click="{() => dispatch('action')}" tabindex="-1">
            <SvgIcon name="enter" />
            {attributes.action || 'OK'}
          </button>
        </div>
      {/if}
    </div>
  {:else if attributes.confirm}
    <div>
      <h3 class="reset flex center" class:space={attributes.gap}>
        {#if attributes.icon}
          <SvgIcon name={attributes.icon} />
        {/if}
        {attributes.confirm}
      </h3>
      {#if attributes.description}<p>{@html attributes.description}</p>{/if}
      <div class="flex space center justify actions">
        <button class="link" on:click="{() => dispatch('cancel')}" tabindex="-1">{attributes.cancel || 'CANCEL'}</button>
        or
        <button class="action flex space" on:click="{() => dispatch('confirm')}" tabindex="-1">
          <SvgIcon name="enter" />
          {attributes.continue || 'CONTINUE'}
        </button>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</div>
