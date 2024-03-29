import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

// Components
import Title from './components/Title';
//   Pages
import AccountEditPage from './components/AccountEditPage';
import AccountPage from './components/AccountPage';
import AccountsPage from './components/AccountsPage';
import AccountTeamPage from './components/AccountTeamPage';
import AdminClustersPage from './components/AdminClustersPage';
import AdminIngressPage from './components/AdminIngressPage';
import AdminRestorePage from './components/AdminRestorePage';
import AdminSecretsPage from './components/AdminSecretsPage';
import AdminSummaryPage from './components/AdminSummaryPage';
import AuditPage from './components/AuditPage';
import ClusterEditPage from './components/ClusterEditPage';
import DeployPage from './components/DeployPage';
import DeploymentsPage from './components/DeploymentsPage';
import DeploymentDetailsPage from './components/DeploymentDetailsPage';
import HomePage from './components/HomePage';
import JobPage from './components/JobPage';
import JobsPage from './components/JobsPage';
import JobVersionPage from './components/JobVersionPage';
import NamespacesPage from './components/NamespacesPage';
import NamespaceDetailsPage from './components/NamespaceDetailsPage';
import NamespaceEditPage from './components/NamespaceEditPage';
import NamespaceManagePage from './components/NamespaceManagePage';
import NewIngressVersionPage from './components/NewIngressVersionPage';
import NewJobVersionPage from './components/NewJobVersionPage';
import NewSecretVersionPage from './components/NewSecretVersionPage';
import RegistriesPage from './components/RegistriesPage';
import ReleasesPage from './components/ReleasesPage';
import ServicesPage from './components/ServicesPage';
import ServiceDetailsPage from './components/ServiceDetailsPage';
import ServiceIngressPage from './components/ServiceIngressPage';
import ServiceManagePage from './components/ServiceManagePage';
import ServiceStatusPage from './components/ServiceStatusPage';
import ServiceNamespaceAttrsPage from './components/ServiceNamespaceAttrsPage';
import SecretOverviewPage from './components/SecretOverviewPage';
import SecretVersionViewPage from './components/SecretVersionViewPage';
import TeamPage from './components/TeamPage';
import TeamAttrsPage from './components/TeamAttrsPage';
import TeamEditPage from './components/TeamEditPage';
import TeamsPage from './components/TeamsPage';

import paths from './paths';

const Wrapper = ({ title, children }) => (
  <div>
    <Title title={title} />
    {children}
  </div>
);

export default () => <Switch>
  <Route
    exact
    path={paths.registries.route}
    render={() => <Wrapper title="Registries"><RegistriesPage /></Wrapper>}
  />
  <Route
    exact
    path={paths.namespaces.route}
    render={() => <Wrapper title="Namespaces"><NamespacesPage /></Wrapper>}
  />
  <Route
    exact
    path={paths.namespace.route}
    render={(props) => <Wrapper title="Namespace">
          <NamespaceDetailsPage
            namespaceId={props.match.params.namespaceId}
            />
        </Wrapper>}
  />
  <Route
    exact
    path={paths.namespaceEdit.route}
    render={({ match }) =>
      <Wrapper title="Edit namespace">
        <NamespaceEditPage
          namespaceId={match.params.namespaceId}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.namespaceManage.route}
    render={({ match }) =>
      <Wrapper title="Manage namespace">
        <NamespaceManagePage
          namespaceId={match.params.namespaceId}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.accounts.route}
    render={() => <Wrapper title="Accounts"><AccountsPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.account.route}
    render={({ match }) =>
      <Wrapper title="Account">
        <AccountPage
          accountId={match.params.accountId}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.accountEdit.route}
    render={({ match }) =>
      <Wrapper title="Edit account">
        <AccountEditPage
          accountId={match.params.accountId}
          />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.editAccountTeams.route}
    render={({ match }) =>
      <Wrapper title="Edit account team membership">
        <AccountTeamPage
          accountId={match.params.accountId}
          />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.releases.route}
    render={() => <Wrapper title="Releases"><ReleasesPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.deployments.route}
    render={() => <Wrapper title="Deployments"><DeploymentsPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.deployment.route}
    render={({ match }) => <Wrapper>
          <DeploymentDetailsPage />
        </Wrapper>}
  />
  <Route
    exact
    path={paths.newIngressVersion.route}
    render={() => {
      return <Wrapper title="New ingress version"><NewIngressVersionPage /></Wrapper>;
    }}
  />
  <Route
    exact
    path={paths.job.route}
    render={() => <Wrapper title="CronJob"><JobPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.jobs.route}
    render={() => <Wrapper title="CronJobs"><JobsPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.jobVersion.route}
    render={() => <Wrapper title="CronJob Version"><JobVersionPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.newJobVersion.route}
    render={() => {
      return <Wrapper title="New cronjob version"><NewJobVersionPage /></Wrapper>;
    }}
  />
  <Route
    exact
    path={paths.services.route}
    render={() => <Wrapper title="Services"><ServicesPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.service.route}
    render={({ match }) =>
      <Wrapper title="Service">
        <ServiceDetailsPage
          registryName={match.params.registry}
          serviceName={match.params.name}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.serviceStatus.route}
    render={({ match }) =>
      <Wrapper title="Service status">
        <ServiceStatusPage
          registryName={match.params.registry}
          serviceName={match.params.name}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.serviceIngress.route}
    render={({ match, location }) =>
      <Wrapper title="Service ingress">
        <ServiceIngressPage
          registryName={match.params.registry}
          serviceName={match.params.name}
          versionId={match.params.version}
          location={location}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.serviceManage.route}
    render={({ match }) =>
      <Wrapper title="Service">
        <ServiceManagePage
          registryName={match.params.registry}
          serviceName={match.params.name}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.serviceNamespaceAttrs.route}
    render={({ match }) =>
      <Wrapper title="Service Attributes">
        <ServiceNamespaceAttrsPage
          registryName={match.params.registry}
          serviceName={match.params.name}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.secretOverview.route}
    render={({ match }) =>
      <Wrapper title="Secret">
        <SecretOverviewPage
          registryName={match.params.registry}
          serviceName={match.params.name}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.newSecretVersion.route}
    render={({ match }) =>
      <Wrapper title="Secret">
        <NewSecretVersionPage
          registryName={match.params.registry}
          serviceName={match.params.name}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.secretVersion.route}
    render={({ match }) =>
      <Wrapper title="Secret">
        <SecretVersionViewPage
          version={match.params.version}
        />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.team.route}
    render={({ match }) =>
      <Wrapper title="Team">
        <TeamPage />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.teamAttrs.route}
    render={({ match }) =>
      <Wrapper title="Edit team">
        <TeamAttrsPage />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.teamEdit.route}
    render={({ match }) =>
      <Wrapper title="Edit team">
        <TeamEditPage />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.teams.route}
    render={({ match }) =>
      <Wrapper title="Teams">
        <TeamsPage />
      </Wrapper>
    }
  />
  <Route
    exact
    path={paths.deploy.route}
    render={({ location }) => {
      return <Wrapper title="Deploy"><DeployPage /></Wrapper>;
    }}
  />
  <Route
    exact
    path={paths.adminClusters.route}
    render={() => <Wrapper><AdminClustersPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.clusterEdit.route}
    render={() => <Wrapper><ClusterEditPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.adminIngress.route}
    render={() => <Wrapper><AdminIngressPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.adminRestore.route}
    render={() => <Wrapper><AdminRestorePage /></Wrapper> }
  />
  <Route
    exact
    path={paths.adminSecrets.route}
    render={() => <Wrapper><AdminSecretsPage /></Wrapper> }
  />
  <Route
    exact
    path={paths.admin.route}
    render={() => <Wrapper><AdminSummaryPage /></Wrapper> }
  />
  <Route path="/audit">
    <Redirect to={paths.audit.route} />
  </Route>
  <Route
    exact
    path={paths.audit.route}
    render={() => <Wrapper><AuditPage /></Wrapper> }
  />
  <Route
    path={paths.home.route}
    render={() => <Wrapper><HomePage /></Wrapper> }
  />
</Switch>;
