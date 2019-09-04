
process.env.stage = 'dev';
process.env.cardsTableName = 'flash-api-cards-dev';
process.env.decksTableName = 'flash-api-decks-dev';

const { ApolloServer, gql } = require('apollo-server');
const createApolloServer = require('../../src/graphql/createApolloServer');

createApolloServer(ApolloServer, gql
  // , ({ req }) => {
  //   return { user: { id: 'google-oauth2|1234' } };
  // }
).listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
