# kube-hackday
See https://github.com/tes/infra/issues/1857 for background

## Goal
Discover a kubernetes deployment pipeline

##
<pre>
┌────────────────────┬──────────────────────────────┐
│                    │ Kubernetes Manifest Template │
│                    ├──────────────────────────────┤
│                    │      Dockerfile              │
│    Hello World     ├──────────────────────────────┤
│                    │       index.js               │
│                    ├──────────────────────────────┘
│                    │
└────────────────────┘
           │
           │
           ▼
┌────────────────────┐
│                    │
│                    │
│                    │
│       GitHub       │
│                    │
│                    │
│                    │                                                                                                                     
└────────────────────┘
           │
           │
           ▼
┌────────────────────┐
│                    │
│                    │
│                    │
│      Jenkins       │──────────────────────┐
│                    │                      │
│                    │                      │
│                    │                      │
├────────────────────┤                      │
│    Release Tool    │                      │
└────────────────────┘                      │
           │                                │
           │                                │
           │                                │
           │                                │
           ▼                                ▼
┌────────────────────┐           ┌────────────────────┐
│                    │           │                    │
│                    │           │                    │
│                    │           │                    │
│  Deployment Tool   │           │  Docker Registry   │
│                    │           │                    │
│                    │           │                    │
│                    │           │                    │
└────────────────────┘           └────────────────────┘
           │                                │
           │                                │
           │                                │
           ▼                                │
┌────────────────────┐                      │
│                    │                      │
│                    │                      │
│                    │                      │
│ Kubernets Cluster  │◀─────────────────────┘
│                    │
│                    │
│                    │
└────────────────────┘
</pre>

## MVP Tasks
### Hello World
Write a hello world application which respond with "Hello World" over an HTTP interface. For MVP don't worry about setting up a TES style electric project. Do the simplest thing, e.g. [http-server](https://www.npmjs.com/package/http-server) serving a static page

Additionally the application should include:

* a Dockerfile
* Kubernetes manifest template

The Dockerfile should be very simple. I suggest basing it on node:8-alpine, running npm install and launching node index.js

The Kubernetes manifest template should use a placeholder for the containers image, but can hard code everything else. Use a templating language which will work nicely with both yaml and json.

### Jenkins Job
Create a Jenkins job to build the docker image and publish it to the TES docker repository

### Release Tool
We need to get release data (e.g. the manifest file, image name etc) from Jenkins to the Deployment Tool. Write a command line node module for POSTing the following information to the Deployment tool

* The Kubernets Manifest File
* Image Details

e.g. 
```
npm run kube-release \
  --manifest ./manifest.json \
  --image docker-registry.tescloud.com/tescloud/app-h2o:23 \
  --server https://kube-deployment-tool.tescloud.com \
```
Would result in
```
POST /api/releases
Content-Type: application/json

{
  "manifest": {
    "content-type": "application/json",
    "content": "contents of the template"
  },
  "image": {
    "registry": "docker.tescloud.com",
    "user": "tescloud",
    "repo": "app-h2o",
    "tag": "23"
  }
}
```
Fail on non 2XX series responses.

Implement the node module so that it can be called using an npm script ```npm run kube-release``` see [prerelease-ftw](https://github.com/guidesmiths/prerelease-ftw) for an example. 

Publish the node module to sinopia
Update the Hello World app to include the kube-release script
Update the Jenkins Job to call the kube-release script

### Deployment Tool
The Deployment tool needs to 
* Update the kubernetes manfest with the docker image
* Deploy the Hello World application using the Kubernetes API. It should POST the whole manifest, not patch it.

### Kubernets Cluster
We need access to a kubernetes cluster and instructions for installing / configuring CLI tools

## Next Steps
1. Add a UI to the Deployment Tool, listing releases
1. Define default, environmental and service specific settings for things like instancess, resource limits etc
1. Support promotions
1. Release Tool authentication (API KEY?)
1. UI authentication (github)
1. Team based permissions
1. Support yaml and json manifests
1. Define service criteria (e.g. single node process, logs to stdout, responds to SIGINT and SIGTERM, exposes liveness and readiness endpoints)
1. HipChat integration
1. Audit All Releases
