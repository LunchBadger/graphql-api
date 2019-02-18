const { RESTDataSource } = require('apollo-datasource-rest');

class ProjectAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = '';
  }

  async getSharedProjects({ username }) {
    // localhost:9999
    // git-api.default
    const host = 'http://git-api.default';
    const res = await this.get(`${host}/users/customer/${username}/myrepos`);
    return res;
  }

  async getProject({ projectBaseURL, projectId }) {
    const res = await this.get(`${projectBaseURL}/Projects/${projectId}`);
    return res;
  }

  async saveProject({ projectBaseURL, data}) {
    const res = await this.patch(`${projectBaseURL}/Projects/`, {...data});
    return res;
  }

  async updateExpressGatewayPipeline(url, data) {
    const res = await this.put(url, {...data});
    return res;
  }

}

module.exports = ProjectAPI;
