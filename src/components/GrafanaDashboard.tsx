import React, { useEffect, useState } from "react";
import { getGrafanaDashboardConfig, buildGrafanaUrl, GrafanaDashboardConfig } from "../services/grafana";

const GrafanaDashboard: React.FC = () => {
  const [dashboardUrl, setDashboardUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [config, setConfig] = useState<GrafanaDashboardConfig | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Try to fetch config from backend
        try {
          const dashboardConfig = await getGrafanaDashboardConfig();
          setConfig(dashboardConfig);
          const url = buildGrafanaUrl(dashboardConfig);
          setDashboardUrl(url);
        } catch (backendError) {
          // Fallback to default config if backend is not available
          console.warn("Backend config not available, using default config:", backendError);
          const defaultConfig: GrafanaDashboardConfig = {
            baseUrl: "http://localhost:3000",
            dashboardUid: "ad5c9jk",
            kiosk: true,
            dashboardName: "executive-dashboard-test-plant-001",
            orgId: 1,
            from: "now-6h",
            to: "now",
            timezone: "browser",
            refresh: "5s",
          };
          setConfig(defaultConfig);
          const url = buildGrafanaUrl(defaultConfig);
          setDashboardUrl(url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
        console.error("Error loading Grafana dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="grafana-container">
        <div className="grafana-loading">
          <div className="loading-spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grafana-container">
        <div className="grafana-error">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!dashboardUrl) {
    return (
      <div className="grafana-container">
        <div className="grafana-error">
          <p>No dashboard URL configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grafana-container">
      <div className="grafana-wrapper">
        <iframe
          src={dashboardUrl}
          className="grafana-iframe"
          title="Grafana Dashboard"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default GrafanaDashboard;