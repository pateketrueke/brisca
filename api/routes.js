export default router => router()
  .namespace('/', group => group({ lookup: 'Handlers.%Controller' })
    .get('/health', { to: 'Test.getOK' }));
