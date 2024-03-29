module.exports = {
  logger: {
    transport: 'bunyan',
    include: [
      'tracer',
      'timestamp',
      'level',
      'message',
      'error.message',
      'error.code',
      'error.stack',
      'request.url',
      'request.headers',
      'request.params',
      'request.method',
      'response.statusCode',
      'response.headers',
      'response.time',
      'process',
      'system',
      'package.name',
      'app',
    ],
    exclude: [
      'password',
      'secret',
      'token',
      'request.headers.authorization',
      'request.headers.cookie',
      'dependencies',
      'devDependencies',
    ],
  },
  app: {
    middleware: {
      showErrorDetail: true,
    },
  },
  postgres: {
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000 * 60 * 5,
    onConnect: [
      'SET client_min_messages = WARNING',
    ],
    max: 20
  },
  routes: {
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
  },
  session: {
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 30 days
    }
  },
  store: {
    nukeable: false,
  },
  transports: {
    human: {
      level: 'debug',
    },
  },
  broadcast: {},
};
