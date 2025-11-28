import React, { useState, useEffect } from "react";
import { monitoringService } from "../services/monitoring";
import { plantsService } from "../services/plants";
import DataTable, { Column } from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import ChartCard from "../components/ChartCard";
import LineChart from "../components/charts/LineChart";
import { DeviceSnapshot, Plant, DeviceType, DeviceMetricsHistory } from "../types/api";
import { format } from "date-fns";
import "./Monitoring.css";

const Monitoring: React.FC = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>();
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | undefined>();
  const [devices, setDevices] = useState<DeviceSnapshot[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSnapshot | null>(null);
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetricsHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadDevices();
  }, [selectedPlantId, selectedDeviceType, page]);

  useEffect(() => {
    if (selectedDevice) {
      loadDeviceMetrics();
    }
  }, [selectedDevice]);

  const loadPlants = async () => {
    try {
      const data = await plantsService.list();
      setPlants(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load plants");
    }
  };

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await monitoringService.listDevices(
        selectedPlantId,
        selectedDeviceType,
        (page - 1) * pageSize,
        pageSize
      );
      setDevices(response.items);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceMetrics = async () => {
    if (!selectedDevice) return;
    try {
      const metrics = await monitoringService.getDeviceMetrics(
        selectedDevice.device_type,
        selectedDevice.device_id,
        6
      );
      setDeviceMetrics(metrics);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load device metrics");
    }
  };

  const columns: Column<DeviceSnapshot>[] = [
    {
      key: "device_type",
      header: "Device Type",
      render: (item) => (
        <span style={{ textTransform: "capitalize" }}>
          {item.device_type.replace("_", " ")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "device_id",
      header: "Device ID",
      sortable: true,
    },
    {
      key: "recorded_at",
      header: "Last Updated",
      render: (item) => format(new Date(item.recorded_at), "MMM dd, yyyy HH:mm"),
      sortable: true,
    },
    {
      key: "metric_summary",
      header: "Metrics",
      render: (item) => {
        const metrics = item.metric_summary || {};
        const keys = Object.keys(metrics).slice(0, 3);
        return (
          <div style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
            {keys.map((key) => (
              <span key={key} style={{ marginRight: "0.5rem" }}>
                {key}: {typeof metrics[key] === "number" ? metrics[key].toFixed(2) : metrics[key]}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="monitoring-container">
      <div className="monitoring-header">
        <h1>Monitoring</h1>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="monitoring-filters">
        <select
          className="select"
          value={selectedPlantId || ""}
          onChange={(e) => {
            setSelectedPlantId(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
          style={{ width: "auto", minWidth: "200px" }}
        >
          <option value="">All Plants</option>
          {plants.map((plant) => (
            <option key={plant.id} value={plant.id}>
              {plant.name || `Plant ${plant.plant_code}`}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={selectedDeviceType || ""}
          onChange={(e) => {
            setSelectedDeviceType(e.target.value || undefined);
            setPage(1);
          }}
          style={{ width: "auto", minWidth: "200px" }}
        >
          <option value="">All Device Types</option>
          <option value={DeviceType.INVERTER}>Inverters</option>
          <option value={DeviceType.WMS}>WMS Boxes</option>
          <option value={DeviceType.STRING_MONITOR}>String Monitoring</option>
          <option value={DeviceType.ABT_METER}>ABT Meters</option>
        </select>
      </div>

      <div className="monitoring-content">
        <div className="monitoring-devices">
          <DataTable
            data={devices}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={setSelectedDevice}
            loading={loading}
            emptyMessage="No devices found"
            pagination={
              total > pageSize
                ? {
                    page,
                    pageSize,
                    total,
                    onPageChange: setPage,
                  }
                : undefined
            }
          />
        </div>

        {selectedDevice && deviceMetrics && (
          <div className="monitoring-details">
            <ChartCard title={`Device ${selectedDevice.device_id} Metrics`}>
              {deviceMetrics.history.length > 0 ? (
                <LineChart
                  data={deviceMetrics.history.map((h) => ({
                    timestamp: h.timestamp,
                    ...h.metrics,
                  }))}
                  dataKey="power_kw"
                  name="Power"
                  xAxisKey="timestamp"
                  color="var(--color-primary)"
                  unit="kW"
                />
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
                  No metrics available
                </div>
              )}
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;
