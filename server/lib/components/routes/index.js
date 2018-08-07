import systemic from 'systemic';
import system from './system';
import accounts from './accounts';
import registries from './registries';
import releases from './releases';
import clusters from './clusters';
import namespaces from './namespaces';
import deployments from './deployments';
import app from './app';

const minimumRequirements = [
  'config',
  'logger',
  'app',
  {
    component: 'logger.middleware',
    destination: 'loggerMiddleware'
  }
];

export default () => systemic({
    name: 'routes'
  })
  .add('routes.system', system())
    .dependsOn(...minimumRequirements, 'pkg')
  .add('routes.accounts', accounts())
    .dependsOn(...minimumRequirements, 'store', 'auth')
  .add('routes.registries', registries())
    .dependsOn(...minimumRequirements, 'store', 'auth')
  .add('routes.releases', releases())
    .dependsOn(...minimumRequirements, 'store', 'checksum', 'kubernetes', 'auth')
  .add('routes.clusters', clusters())
    .dependsOn(...minimumRequirements, 'store', 'kubernetes', 'auth')
  .add('routes.namespaces', namespaces())
    .dependsOn(...minimumRequirements, 'store', 'kubernetes', 'auth')
  .add('routes.deployments', deployments())
    .dependsOn(...minimumRequirements, 'store', 'kubernetes', 'auth')
  .add('routes.app', app())
    .dependsOn(...minimumRequirements, 'auth', 'passport')
  .add('routes')
    .dependsOn(
      'routes.system',
      'routes.accounts',
      'routes.registries',
      'routes.releases',
      'routes.clusters',
      'routes.namespaces',
      'routes.deployments',
      'routes.app'
    );
