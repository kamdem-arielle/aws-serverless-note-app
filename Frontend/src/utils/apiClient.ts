import { CognitoUserPool } from 'amazon-cognito-identity-js';
import axios from 'axios';

const poolData = {
  UserPoolId: 'us-east-1_UhvfJZNSU',
  ClientId: '6vtp7h07uuo2trafec2v0r55a4',
};

const userPool = new CognitoUserPool(poolData);

const apiClient = axios.create({
  baseURL: 'https://d3sl6qseokrte.cloudfront.net/api/prod',
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(async (config) => {
  const user = userPool.getCurrentUser();

  // No logged-in user — let the request through without auth (sign-in/sign-up calls)
  if (!user) {
    console.log('[interceptor] No user session, passing request without auth');
    return config;
  }

  try {
    const session = await new Promise<any>((resolve, reject) => {
      user.getSession((err: any, sess: any) => {
        if (err) reject(err);
        else resolve(sess);
      });
    });

    const now = Math.floor(Date.now() / 1000);
    const expiration = session.getAccessToken().getExpiration();
    const timeLeft = expiration - now;

    console.log('[interceptor] Token expires in', timeLeft, 'seconds');

    // Token still valid for more than 60 seconds
    if (timeLeft >= 60) {
      config.headers.Authorization = `Bearer ${session.getAccessToken().getJwtToken()}`;
      return config;
    }

    // Token expiring soon — another request is already refreshing
    if (isRefreshing) {
      console.log('[interceptor] Refresh in progress, queuing request');
      return new Promise<typeof config>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(config);
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    // This request is the leader — initiate refresh
    isRefreshing = true;
    console.log('[interceptor] Token expiring, refreshing session...');

    return new Promise<typeof config>((resolve, reject) => {
      user.getSession((err: any, newSession: any) => {
        isRefreshing = false;

        if (err) {
          console.error('[interceptor] Session refresh failed:', err.message);
          processQueue(err, null);
          user.signOut();
          window.location.href = '/signin';
          reject(err);
        } else {
          const newToken = newSession.getAccessToken().getJwtToken();
          console.log('[interceptor] Session refreshed successfully');
          processQueue(null, newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(config);
        }
      });
    });
  } catch (err) {
    console.error('[interceptor] getSession failed, signing out:', err);
    user.signOut();
    window.location.href = '/signin';
    return Promise.reject(err);
  }
});

export default apiClient;
