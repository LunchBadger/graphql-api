const { gql } = require('apollo-server');
const GraphQLJSON = require('graphql-type-json');

const typeDefs = gql`
  scalar JSON

  type Query {
    loadSharedProjects(
      username: String!
    ): SharedProjects!
    saveProject(
      projectBaseURL: String!
      workspaceBaseURL: String!
      projectId: String!
      data: JSON
    ): Project
    project(
      projectBaseURL: String!
      workspaceBaseURL: String!
      projectId: String!
    ): Project
    launches(
      """
      The number of results to show. Must be >= 1. Default = 20
      """
      pageSize: Int
      """
      If you add a cursor here, it will only return results _after_ this cursor
      """
      after: String
    ): LaunchConnection!
    launch(id: ID!): Launch
    me: User
  }

  type Mutation {
    # if false, signup failed -- check errors
    bookTrips(launchIds: [ID]!): TripUpdateResponse!

    # if false, cancellation failed -- check errors
    cancelTrip(launchId: ID!): TripUpdateResponse!

    login(email: String): String # login token
  }

  type TripUpdateResponse {
    success: Boolean!
    message: String
    launches: [Launch]
  }

  """
  Simple wrapper around our list of launches that contains a cursor to the
  last item in the list. Pass this cursor to the launches query to fetch results
  after these.
  """
  type LaunchConnection {
    cursor: String!
    hasMore: Boolean!
    launches: [Launch]!
  }

  type Launch {
    id: ID!
    site: String
    mission: Mission
    rocket: Rocket
    isBooked: Boolean!
  }

  type Rocket {
    id: ID!
    name: String
    type: String
  }

  type User {
    id: ID!
    email: String!
    trips: [Launch]!
  }

  type Mission {
    name: String
    missionPatch(size: PatchSize): String
  }

  enum PatchSize {
    SMALL
    LARGE
  }

  type Project {
    id: String
    name: String
    datasources: [JSON]
    gateways: [JSON]
    serviceEndpoints: [JSON]
    apiEndpoints: [JSON]
    apis: [JSON]
  }

  type SharedProjects {
    username: String!
    sharedProjects: [SharedProject]!
  }

  type SharedProject {
    username: String!
    projects: [ProjectBasics]!
  }

  type ProjectBasics {
    name: String!
    permissions: Permissions
  }

  type Permissions {
    admin: Boolean
    push: Boolean
    pull: Boolean
  }
`;

module.exports = typeDefs;
