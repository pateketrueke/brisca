import grown from 'grown';

const Grown = grown();

Grown.use(import('@grown/router'));
Grown.use(import('@grown/session'));

Grown.use(import('./database/models.js'));
Grown.use(import('./controllers/index.js'));

import {
  Unauthorized,
} from './errors.js';

let app;
export default Grown.ready(async () => {
  app = new Grown({
    uws: false,
    cors: true,
    cache: false,
    trust: 'proxy',
  });

  app.on('listen', () => Grown.Models.connect());
  app.plug([
    Grown.Session,
    Grown.Router({
      routes: await import('./routes.js'),
      default_pipelines: {
        auth: ctx => {
          if (ctx.req_headers.authorization) {
            const [, token] = ctx.req_headers.authorization.split(' ');

            if (ctx.session.token === token) return;
          }
          throw new Unauthorized();
        },
      },
    }),
  ]);

  return app;
});

Grown.main(import.meta, () => {
  app.listen(process.env.API_PORT || 3001, ({ location }) => {
    console.log('Listening on', location.href);
  });
});
