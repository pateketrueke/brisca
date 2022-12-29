export default router => router({ lookup: 'Handlers.%Controller' }, group => group()
    .get('/health', { to: 'Test.getOK' }));
