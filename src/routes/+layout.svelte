<script>
	import favicon from '$lib/assets/favicon.svg';
	export const prerender = true;
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<style lang="less">
    @import '../styles.less';
</style>

{@render children()}
