/* eslint-disable implicit-arrow-linebreak */
export default router =>
  router({ lookup: 'Handlers.%Controller' },
    routes => routes()
      .get('/health', { to: 'Test.getOK' }));
