import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { config } from '@/config';
import { storage } from '@/utils/storage';

const httpLink = new HttpLink({
  uri: () => config.graphqlEndpoint,
  fetch: (uri, options) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    return fetch(uri as string, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
  },
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
    if (window.location.pathname !== '/login') {
      const from = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(from)}`;
      // 通知宿主 iframe session 已失效
      try {
        window.parent.postMessage({ type: 'SESSION_EXPIRED' }, '*');
      } catch {
        // 非 iframe 环境忽略
      }
    }
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          featureList: {
            keyArgs: ['nodeIds', 'includeHidden'],
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
