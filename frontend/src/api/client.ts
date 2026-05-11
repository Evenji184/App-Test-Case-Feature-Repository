import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { storage } from '@/utils/storage';

const apiScheme = import.meta.env.VITE_API_SCHEME || 'http';
const apiHost = import.meta.env.VITE_API_HOST || 'localhost';
const apiPort = import.meta.env.VITE_API_PORT || '8001';
const graphqlEndpoint = `${apiScheme}://${apiHost}:${apiPort}/graphql`;

const httpLink = new HttpLink({
  uri: graphqlEndpoint,
});

const authLink = new ApolloLink((operation, forward) => {
  const token = storage.getToken();

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  }));

  return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  const unauthorized = graphQLErrors?.some((error) => error.message.includes('认证') || error.message.includes('Unauthorized'));

  if (unauthorized || ('statusCode' in (networkError ?? {}) && (networkError as { statusCode?: number }).statusCode === 401)) {
    storage.clearAuth();
    window.location.href = '/login';
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          featureList: {
            keyArgs: ['nodeId'],
          },
          searchFeatures: {
            keyArgs: ['keyword'],
          },
          userList: {
            keyArgs: ['keyword'],
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});
