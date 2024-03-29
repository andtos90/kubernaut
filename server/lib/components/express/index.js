import systemic from 'systemic';
import { defaultMiddleware, app, server } from 'systemic-express';
import session from './session-postgres';

export default () => systemic({ name: 'express' })
  .add('app', app()).dependsOn('config', 'logger')
  .add('app.middleware', defaultMiddleware()).dependsOn('config', 'logger', 'app', 'routes')
  .add('server', server()).dependsOn('config', 'app', 'app.middleware')
  .add('session', session()).dependsOn('config', 'logger', 'postgres');
