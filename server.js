import grownFactory from 'grown';

const Grown = grownFactory();
const app = new Grown({
  uws: true,
  cors: true,
  cache: false,
  trust: 'proxy',
});

app.mount(ctx => {
  ctx.res.write('OK');
  ctx.res.end();
});

export default app;

Grown.main(import.meta, () => {
  app.listen(process.env.API_PORT || 3001);
});
