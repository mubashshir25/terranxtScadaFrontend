// Runtime configuration utility
// This provides a centralized way to access configuration values

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      REACT_APP_API_URL?: string;
    };
  }
}

/**
 * Get the API base URL from runtime config, build-time env, or fallback
 */
export const getApiUrl = (): string => {
  return (
    window.__RUNTIME_CONFIG__?.REACT_APP_API_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:8000"
  );
};

/**
 * Get the WebSocket URL derived from the API URL
 * Converts http:// to ws:// and https:// to wss://
 */
export const getWebSocketUrl = (path: string = ""): string => {
  const apiUrl = getApiUrl();
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return `${wsUrl}${path}`;
};

export default {
  getApiUrl,
  getWebSocketUrl,
};

