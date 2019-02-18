const { paginateResults } = require('./utils');
const GraphQLJSON = require('graphql-type-json');

const transformMyRepos = (data) => {
  const repos = data.repos
    .map(({owner, name: project, permissions}) => ({
      username: owner.username.replace('customer-', ''),
      project,
      permissions,
    }))
    .reduce((map, {username, project, permissions}) => ({
      ...map,
      [username]: {
        ...(map[username] || {}),
        [project]: permissions
      },
    }), {});
  return Object.keys(repos)
    .reduce((map, username) => [
      ...map,
      {
        username,
        projects: repos[username],
      }
    ], [])
    .filter(({projects}) => true
      && projects.dev
      && projects.dev.push
      && projects.dev.pull
      && projects.functions
      && projects.functions.push
      && projects.functions.pull
    )
    .map(({username, projects}) => ({
      username,
      projects: [{
        name: 'dev',
        permissions: projects.dev,
      }],
    }));
};

const loadProjectData = async ({ projectBaseURL, workspaceBaseURL, projectId }, {dataSources }) => {
  const project = await dataSources.projectAPI.getProject({ projectBaseURL, projectId});
  const datasources = await dataSources.workspaceAPI.getDatasources({ workspaceBaseURL});
  return {
    ...project,
    datasources,
  };
};

const egTransformPipeline = (data, pipeline) => {
  const policies = pipeline.policies.map(policy => {
    const json = {...policy};
    delete json.id;
    Object.values(json).forEach((conditionActions) => {
      conditionActions.forEach(conditionAction => {
        delete conditionAction.id;
      });
    });
    return json;
  });
  const apiEndpoints = undefined;
  const json = {
    friendlyName: pipeline.name,
    policies,
    apiEndpoints,
  };
  return json;
};

const fakeSharedProjectUsernames = [
  'al',
  'al2',
  'ko',
  'sk',
];

const sortStrings = key => (a, b) => {
  var nameA = a[key].toUpperCase();
  var nameB = b[key].toUpperCase();
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

module.exports = {
  JSON: GraphQLJSON,
  Query: {
    loadSharedProjects: async (_, { username }, { dataSources }) => {
      const myRepos = await dataSources.projectAPI.getSharedProjects({ username });
      return {
        username,
        sharedProjects: transformMyRepos(myRepos),
      };
    },
    saveProject: async (_, { projectBaseURL, workspaceBaseURL, projectId, data: dataStr }, {dataSources }) => {
      const calls = [];
      console.log(dataStr);
      data = JSON.parse(dataStr);
      (data.gateways || []).forEach((gateway) => {
        (gateway.pipelines || []).forEach((pipeline) => {
          const pipelineData = egTransformPipeline(data, pipeline);
          const url = `http://admin-${gateway.dnsPrefix}-${projectId}.staging.lunchbadger.io/pipelines/${pipeline.id}`;
          console.log(url, pipelineData);
          calls.push(dataSources.projectAPI.updateExpressGatewayPipeline(url, pipelineData));
        });
      });
      calls.push(dataSources.projectAPI.saveProject({ projectBaseURL, projectId, data}));
      await Promise.all(calls);
      const res = await loadProjectData({ projectBaseURL, workspaceBaseURL, projectId }, { dataSources});
      return res;
    },
    project: async (_, { projectBaseURL, workspaceBaseURL, projectId }, { dataSources}) => {
      const res = await loadProjectData({ projectBaseURL, workspaceBaseURL, projectId }, { dataSources});
      return res;
    },
    launches: async (_, { pageSize = 20, after }, { dataSources }) => {
      const allLaunches = await dataSources.launchAPI.getAllLaunches();
      // we want these in reverse chronological order
      allLaunches.reverse();

      const launches = paginateResults({
        after,
        pageSize,
        results: allLaunches,
      });

      return {
        launches,
        cursor: launches.length ? launches[launches.length - 1].cursor : null,
        // if the cursor of the end of the paginated results is the same as the
        // last item in _all_ results, then there are no more results after this
        hasMore: launches.length
          ? launches[launches.length - 1].cursor !==
            allLaunches[allLaunches.length - 1].cursor
          : false,
      };
    },
    launch: (_, { id }, { dataSources }) =>
      dataSources.launchAPI.getLaunchById({ launchId: id }),
    me: async (_, __, { dataSources }) =>
      dataSources.userAPI.findOrCreateUser(),
  },
  Mutation: {
    bookTrips: async (_, { launchIds }, { dataSources }) => {
      const results = await dataSources.userAPI.bookTrips({ launchIds });
      const launches = await dataSources.launchAPI.getLaunchesByIds({
        launchIds,
      });

      return {
        success: results && results.length === launchIds.length,
        message:
          results.length === launchIds.length
            ? 'trips booked successfully'
            : `the following launches couldn't be booked: ${launchIds.filter(
                id => !results.includes(id),
              )}`,
        launches,
      };
    },
    cancelTrip: async (_, { launchId }, { dataSources }) => {
      const result = dataSources.userAPI.cancelTrip({ launchId });

      if (!result)
        return {
          success: false,
          message: 'failed to cancel trip',
        };

      const launch = await dataSources.launchAPI.getLaunchById({ launchId });
      return {
        success: true,
        message: 'trip cancelled',
        launches: [launch],
      };
    },
    login: async (_, { email }, { dataSources }) => {
      const user = await dataSources.userAPI.findOrCreateUser({ email });
      if (user) return new Buffer(email).toString('base64');
    },
  },
  Project: {

  },
  Launch: {
    isBooked: async (launch, _, { dataSources }) =>
      dataSources.userAPI.isBookedOnLaunch({ launchId: launch.id }),
  },
  Mission: {
    // make sure the default size is 'large' in case user doesn't specify
    missionPatch: (mission, { size } = { size: 'LARGE' }) => {
      return size === 'SMALL'
        ? mission.missionPatchSmall
        : mission.missionPatchLarge;
    },
  },
  User: {
    trips: async (_, __, { dataSources }) => {
      // get ids of launches by user
      const launchIds = await dataSources.userAPI.getLaunchIdsByUser();

      if (!launchIds.length) return [];

      // look up those launches by their ids
      return (
        dataSources.launchAPI.getLaunchesByIds({
          launchIds,
        }) || []
      );
    },
  },
};
