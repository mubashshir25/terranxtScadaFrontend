import api from "./api";

/**
 * Grafana Dashboard Configuration Interface
 * 
 * This interface defines the structure for Grafana dashboard configuration
 * that should be returned by the backend API endpoint: GET /grafana/dashboard/config
 * 
 * Example backend response:
 * {
 *   "baseUrl": "http://localhost:3000",
 *   "dashboardUid": "ad5c9jk",
 *   "kiosk": true,
 *   "dashboardName": "executive-dashboard-test-plant-001",
 *   "orgId": 1,
 *   "from": "now-6h",
 *   "to": "now",
 *   "timezone": "browser",
 *   "refresh": "5s",
 *   "panelId": 123,  // Optional: for single panel view
 *   "vars": {        // Optional: dashboard variables
 *     "plant": "001",
 *     "region": "us-west"
 *   }
 * }
 */
export interface GrafanaDashboardConfig {
  baseUrl: string;
  dashboardUid: string;
  kiosk: boolean;
  dashboardName: string;
  orgId?: number;
  from?: string;
  to?: string;
  timezone?: string;
  refresh?: string;
  panelId?: number;
  vars?: Record<string, string>;
}

/**
 * Fetches Grafana dashboard configuration from the backend API
 * 
 * Expected endpoint: GET /grafana/dashboard/config
 * The backend should return a GrafanaDashboardConfig object
 * that controls what dashboard and parameters are displayed.
 */
export const getGrafanaDashboardConfig = async (): Promise<GrafanaDashboardConfig> => {
  const res = await api.get("/grafana/dashboard/config");
  return res.data;
};

export const buildGrafanaUrl = (config: GrafanaDashboardConfig): string => {
  const { baseUrl, dashboardUid, dashboardName, orgId, from, to, timezone, refresh, panelId, vars } = config;
  
  // Build the base dashboard URL
  const url = new URL(`${baseUrl}/d/${dashboardUid}/${dashboardName}`);
  
  // Add query parameters
  if (orgId !== undefined) url.searchParams.set("orgId", orgId.toString());
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);
  if (timezone) url.searchParams.set("timezone", timezone);
  if (refresh) url.searchParams.set("refresh", refresh);
  if (panelId !== undefined) url.searchParams.set("panelId", panelId.toString());
  
  // Add custom variables
  if (vars) {
    Object.entries(vars).forEach(([key, value]) => {
      url.searchParams.set(`var-${key}`, value);
    });
  }

  url.searchParams.set("kiosk", "true");
  
  return url.toString();
};

