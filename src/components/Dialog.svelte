<script>
  import SvgIcon from './SvgIcon.svelte';

  let {
    children = undefined,
    onAction = undefined,
    onCancel = undefined,
    onConfirm = undefined,
    attributes = {},
    hidden = false,
  } = $props();

  /* eslint svelte/no-at-html-tags: off */
</script>

<div class="overlay" class:shown={hidden === false}>
  {#if attributes.message}
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
          <button class="action flex space" onclick={onAction} tabindex="-1">
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
        <button class="link" onclick={onCancel} tabindex="-1"
          >{attributes.cancel || 'CANCEL'}</button
        >
        or
        <button class="action flex space" onclick={onConfirm} tabindex="-1">
          <SvgIcon name="enter" />
          {attributes.continue || 'CONTINUE'}
        </button>
      </div>
    </div>
  {:else}
    {@render children?.()}
  {/if}
</div>
