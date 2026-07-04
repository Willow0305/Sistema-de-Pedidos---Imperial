const browserLocation =
  typeof window !== 'undefined'
    ? window.location
    : ({ protocol: 'http:', hostname: 'localhost', host: 'localhost:4200', port: '4200' } as Location);

const httpProtocol = browserLocation.protocol === 'https:' ? 'https:' : 'http:';
const wsProtocol = browserLocation.protocol === 'https:' ? 'wss:' : 'ws:';
const isAngularDevServer = browserLocation.port === '4200';

export const environment = {
  production: false,
  apiUrl: isAngularDevServer
    ? `${httpProtocol}//${browserLocation.hostname}:8000/api`
    : `${browserLocation.origin}/api`,
  wsUrl: isAngularDevServer
    ? `${wsProtocol}//${browserLocation.hostname}:8000`
    : `${wsProtocol}//${browserLocation.host}`,
};
