export default class Namespace {

  constructor({ id, name, cluster, context, createdOn, createdBy }) {
    this.id = id;
    this.name = name;
    this.cluster = cluster;
    this.context = context;
    this.createdOn = createdOn;
    this.createdBy = createdBy;
  }
}
