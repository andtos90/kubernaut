## API

#### Major groups:
- [accounts](accounts.md)
  - current user permissions & information.
  - identities.
  - management.
  - browsing and viewing.
- [clusters](clusters.md)
  - largely administrative use cases.
- [deployments](deployments.md)
  - browsing & viewing.
  - creation.
- [ingress](ingress.md)
  - ingress management (cluster level).
  - viewing and alteration of ingress routing for a service.
- [jobs](jobs.md) (cronjobs)
  - creation.
  - browsing & viewing.
  - management.
- [namespaces](namespaces.md)
  - browsing & viewing.
  - administrative use cases.
- [registries](registries.md)
  - largely administrative use cases.
- [releases](releases.md)
  - browsing & viewing
  - creation.
- [secrets](secrets.md)
  - browsing & viewing
  - creation
- [services](services.md)
  - browsing & viewing.
  - management
- [teams](teams.md)
  - browsing & viewing
  - management.

#### Extras

##### Authorisation/Authentication
Every API requires authentication. This can be provided by the standard UI login mechanism but also via bearer token. These tokens can be generated by a user but also a global admin can generate tokens for other users.

Many API's support cross: cluster, namespace & registry interaction. From browsing services to account & team manipulation. When interacting with any API, all data that is available to view or be modified by a user is tailored to their specific viewpoint based on the authentication model.

##### Pagination
Many API's support pagination by making use of two common query parameters: `limit` & `offset`. For example: `?offset=40&limit=20`.

##### Filtering
Many API's support the use of filters. These can be used in two ways, a simple and a more advanced method.
The simple method is to make use a format common to query parameters, for example: `?namespace=some_name`.
the more advanced version makes use of serialising an object that supports the following properties:
- value - the value to be used in the query.
- exact - the difference between `equals` and `like` in a database query.
- not - allowing for a filter to remove values rather that specifying to find them.

More information around this can be found in these files: [server side](../../server/lib/components/routes/lib/parseFilters.js), [client side](../../client/src/modules/lib/filter.js).
