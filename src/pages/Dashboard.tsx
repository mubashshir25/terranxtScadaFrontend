import React, { useState, useEffect } from "react";
import { dashboardService } from "../services/dashboard";
import { plantsService } from "../services/plants";
import GrafanaDashboard from "../components/GrafanaDashboard";
import MetricCard from "../components/MetricCard";
import ChartCard from "../components/ChartCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import { DashboardOverview, Plant, PowerSeriesPoint, DailyEnergyPoint } from "../types/api";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [powerSeries, setPowerSeries] = useState<PowerSeriesPoint[]>([]);
  const [dailyEnergy, setDailyEnergy] = useState<DailyEnergyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(6);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (selectedPlantId) {
      loadDashboardData();
    }
  }, [selectedPlantId, hours, days]);

  const loadPlants = async () => {
    try {
      const data = await plantsService.list();
      setPlants(data);
      if (data.length > 0 && !selectedPlantId) {
        setSelectedPlantId(data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!selectedPlantId) return;

    setLoading(true);
    setError(null);

    try {
      const [overviewData, powerData, energyData] = await Promise.all([
        dashboardService.getOverview(selectedPlantId, hours),
        dashboardService.getRealtimePower(selectedPlantId, hours),
        dashboardService.getDailyEnergy(selectedPlantId, days),
      ]);

      setOverview(overviewData);
      setPowerSeries(powerData.series);
      setDailyEnergy(energyData.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        {plants.length > 0 && (
          <select
            className="select"
            value={selectedPlantId || ""}
            onChange={(e) => setSelectedPlantId(Number(e.target.value))}
            style={{ width: "auto", minWidth: "200px" }}
          >
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name || `Plant ${plant.plant_code}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {overview && (
        <>
          <div className="dashboard-metrics">
            <MetricCard
              title="Total Power"
              value={overview.metrics.total_power_kw.toFixed(2)}
              unit="kW"
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
            <MetricCard
              title="Live Irradiance"
              value={
                overview.metrics.live_irradiance
                  ? overview.metrics.live_irradiance.toFixed(0)
                  : "N/A"
              }
              unit={overview.metrics.live_irradiance ? "W/m²" : ""}
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
            <MetricCard
              title="Temperature"
              value={
                overview.metrics.temperature_c
                  ? overview.metrics.temperature_c.toFixed(1)
                  : "N/A"
              }
              unit={overview.metrics.temperature_c ? "°C" : ""}
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              }
            />
            <MetricCard
              title="Open Alarms"
              value={overview.metrics.alarm_counts.open || 0}
              unit=""
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>

          <div className="dashboard-charts">
            <ChartCard
              title="Realtime Power"
              actions={
                <select
                  className="select"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  style={{ width: "auto", fontSize: "0.875rem", padding: "0.5rem" }}
                >
                  <option value={1}>Last Hour</option>
                  <option value={6}>Last 6 Hours</option>
                  <option value={12}>Last 12 Hours</option>
                  <option value={24}>Last 24 Hours</option>
                </select>
              }
            >
              {powerSeries.length > 0 ? (
                <LineChart
                  data={powerSeries}
                  dataKey="power_kw"
                  name="Power"
                  xAxisKey="timestamp"
                  color="var(--color-primary)"
                  unit="kW"
                />
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
                  No data available
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Daily Energy"
              actions={
                <select
                  className="select"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={{ width: "auto", fontSize: "0.875rem", padding: "0.5rem" }}
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                  <option value={30}>Last 30 Days</option>
                </select>
              }
            >
              {dailyEnergy.length > 0 ? (
                <BarChart
                  data={dailyEnergy}
                  dataKey="energy_mwh"
                  name="Energy"
                  xAxisKey="date"
                  color="var(--color-accent)"
                  unit="MWh"
                />
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
                  No data available
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}

      <div className="dashboard-grafana">
        <GrafanaDashboard />
      </div>
    </div>
  );
};

export default Dashboard;
