const apiScheme = import.meta.env.VITE_API_SCHEME || 'http';
const apiPort = import.meta.env.VITE_API_PORT || '8001';

// 支持逗号分隔多个 host
const rawHosts = (import.meta.env.VITE_API_HOST || 'localhost') as string;
const candidateHosts = rawHosts.split(',').map((h) => h.trim()).filter(Boolean);

// 优先选与当前页面 hostname 匹配的 host，没有匹配则用第一个
function pickHostByCurrentOrigin(): string {
  const pageHost = window.location.hostname;
  const match = candidateHosts.find((h) => h === pageHost);
  return match ?? candidateHosts[0];
}

export const config = {
  graphqlEndpoint: `${apiScheme}://${candidateHosts[0]}:${apiPort}/graphql`,
  requestTimeoutMs: 300_000,
  storageKeys: {
    token: 'app-feature-library-token',
    user: 'app-feature-library-user',
    permissions: 'app-feature-library-permissions',
  },
};

// 在应用启动时调用，根据当前访问地址匹配对应的 API host
export function resolveApiEndpoint(): Promise<void> {
  if (candidateHosts.length > 1) {
    const host = pickHostByCurrentOrigin();
    config.graphqlEndpoint = `${apiScheme}://${host}:${apiPort}/graphql`;
  }
  return Promise.resolve();
}
