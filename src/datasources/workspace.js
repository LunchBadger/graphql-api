const { RESTDataSource } = require('apollo-datasource-rest');

class WorkspaceAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = '';
  }

  async getDatasources({ workspaceBaseURL }) {
    const res = await this.get(`${workspaceBaseURL}/Facets/server/datasources`);
    return res;
  }

}

module.exports = WorkspaceAPI;
