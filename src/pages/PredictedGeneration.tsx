import React, { useState, useEffect } from "react";
import { predictedGenerationService } from "../services/predictedGeneration";
import { plantsService } from "../services/plants";
import DataTable, { Column } from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import ChartCard from "../components/ChartCard";
import AreaChart from "../components/charts/AreaChart";
import FormModal from "../components/FormModal";
import { GenerationForecast, Plant, GenerationForecastCreate, ForecastHorizon } from "../types/api";
import { format } from "date-fns";
import "./PredictedGeneration.css";

const PredictedGeneration: React.FC = () => {
  const [forecasts, setForecasts] = useState<GenerationForecast[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>();
  const [selectedForecast, setSelectedForecast] = useState<GenerationForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<GenerationForecastCreate>({
    plant_id: 0,
    forecast_date: new Date().toISOString().split("T")[0],
    horizon: ForecastHorizon.DAY_AHEAD,
    data_points: [],
  });

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadForecasts();
  }, [selectedPlantId]);

  const loadPlants = async () => {
    try {
      const data = await plantsService.list();
      setPlants(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, plant_id: data[0].id }));
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load plants");
    }
  };

  const loadForecasts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictedGenerationService.list(selectedPlantId);
      setForecasts(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load forecasts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await predictedGenerationService.create(formData);
      setIsCreateModalOpen(false);
      setFormData({
        plant_id: plants[0]?.id || 0,
        forecast_date: new Date().toISOString().split("T")[0],
        horizon: ForecastHorizon.DAY_AHEAD,
        data_points: [],
      });
      loadForecasts();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create forecast");
    }
  };

  const columns: Column<GenerationForecast>[] = [
    {
      key: "forecast_date",
      header: "Forecast Date",
      render: (item) => format(new Date(item.forecast_date), "MMM dd, yyyy"),
      sortable: true,
    },
    {
      key: "horizon",
      header: "Horizon",
      render: (item) => (
        <span style={{ textTransform: "capitalize" }}>
          {item.horizon.replace("_", " ")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "data_points",
      header: "Data Points",
      render: (item) => item.data_points.length,
    },
    {
      key: "created_at",
      header: "Created",
      render: (item) => format(new Date(item.created_at), "MMM dd, yyyy HH:mm"),
      sortable: true,
    },
  ];

  return (
    <div className="predicted-generation-container">
      <div className="predicted-generation-header">
        <h1>Predicted Generation</h1>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          Create Forecast
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="predicted-generation-filters">
        <select
          className="select"
          value={selectedPlantId || ""}
          onChange={(e) => setSelectedPlantId(e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: "auto", minWidth: "200px" }}
        >
          <option value="">All Plants</option>
          {plants.map((plant) => (
            <option key={plant.id} value={plant.id}>
              {plant.name || `Plant ${plant.plant_code}`}
            </option>
          ))}
        </select>
      </div>

      <div className="predicted-generation-content">
        <div className="predicted-generation-list">
          <DataTable
            data={forecasts}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={setSelectedForecast}
            loading={loading}
            emptyMessage="No forecasts found"
          />
        </div>

        {selectedForecast && (
          <div className="predicted-generation-chart">
            <ChartCard title={`Forecast for ${format(new Date(selectedForecast.forecast_date), "MMM dd, yyyy")}`}>
              {selectedForecast.data_points.length > 0 ? (
                <AreaChart
                  data={selectedForecast.data_points.map((dp) => ({
                    timestamp: dp.timestamp || dp.time || "",
                    power_kw: dp.power_kw || dp.kw || 0,
                  }))}
                  dataKey="power_kw"
                  name="Predicted Power"
                  xAxisKey="timestamp"
                  color="var(--color-accent)"
                  unit="kW"
                />
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
                  No data points available
                </div>
              )}
            </ChartCard>
          </div>
        )}
      </div>

      <FormModal
        isOpen={isCreateModalOpen}
        title="Create Generation Forecast"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        size="large"
      >
        <div className="form-group">
          <label>Plant *</label>
          <select
            className="select"
            value={formData.plant_id}
            onChange={(e) => setFormData({ ...formData, plant_id: Number(e.target.value) })}
            required
          >
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name || `Plant ${plant.plant_code}`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Forecast Date *</label>
          <input
            className="input"
            type="date"
            value={formData.forecast_date}
            onChange={(e) => setFormData({ ...formData, forecast_date: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Horizon *</label>
          <select
            className="select"
            value={formData.horizon}
            onChange={(e) => setFormData({ ...formData, horizon: e.target.value as ForecastHorizon })}
          >
            <option value={ForecastHorizon.DAY_AHEAD}>Day Ahead</option>
            <option value={ForecastHorizon.WEEK_AHEAD}>Week Ahead</option>
            <option value={ForecastHorizon.MONTH_AHEAD}>Month Ahead</option>
          </select>
        </div>
        <div className="form-group">
          <label>Data Points (JSON Array) *</label>
          <textarea
            className="input"
            value={JSON.stringify(formData.data_points, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData({ ...formData, data_points: parsed });
              } catch {
                // Invalid JSON, keep as is
              }
            }}
            rows={10}
            style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            required
          />
          <small style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
            Array of objects with timestamp and power_kw fields
          </small>
        </div>
      </FormModal>
    </div>
  );
};

export default PredictedGeneration;
