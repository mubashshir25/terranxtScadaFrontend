import React, { useState, useEffect } from "react";
import { shadowAnalysisService } from "../services/shadowAnalysis";
import { plantsService } from "../services/plants";
import { digitalTwinsService } from "../services/digitalTwins";
import DataTable, { Column } from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import StatusBadge from "../components/StatusBadge";
import FormModal from "../components/FormModal";
import { ShadowRun, Plant, ShadowRunCreate, ShadowRunStatus, DigitalTwin } from "../types/api";
import { format } from "date-fns";
import "./ShadowAnalysis.css";

const ShadowAnalysis: React.FC = () => {
  const [runs, setRuns] = useState<ShadowRun[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<ShadowRunCreate>({
    plant_id: 0,
    parameters: {},
  });
  const [parametersJson, setParametersJson] = useState("{}");

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadRuns();
  }, [selectedPlantId]);

  useEffect(() => {
    if (formData.plant_id) {
      loadTwins();
    }
  }, [formData.plant_id]);

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

  const loadTwins = async () => {
    try {
      const data = await digitalTwinsService.list(formData.plant_id);
      setTwins(data);
    } catch (err: any) {
      // Ignore errors for twins
    }
  };

  const loadRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shadowAnalysisService.list(selectedPlantId);
      setRuns(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load shadow runs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parameters = formData.parameters;
      if (parametersJson) {
        try {
          parameters = JSON.parse(parametersJson);
        } catch {
          setError("Invalid JSON format");
          return;
        }
      }
      await shadowAnalysisService.create({ ...formData, parameters });
      setIsCreateModalOpen(false);
      setFormData({
        plant_id: plants[0]?.id || 0,
        parameters: {},
      });
      setParametersJson("{}");
      loadRuns();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create shadow run");
    }
  };

  const handleDownload = (run: ShadowRun) => {
    if (run.asset_url) {
      window.open(run.asset_url, "_blank");
    }
  };

  const columns: Column<ShadowRun>[] = [
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} type="shadow" />,
      sortable: true,
    },
    {
      key: "plant_id",
      header: "Plant",
      render: (item) => {
        const plant = plants.find((p) => p.id === item.plant_id);
        return plant?.name || `Plant ${plant?.plant_code || item.plant_id}`;
      },
      sortable: true,
    },
    {
      key: "created_at",
      header: "Created",
      render: (item) => format(new Date(item.created_at), "MMM dd, yyyy HH:mm"),
      sortable: true,
    },
    {
      key: "completed_at",
      header: "Completed",
      render: (item) =>
        item.completed_at ? format(new Date(item.completed_at), "MMM dd, yyyy HH:mm") : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="shadow-actions">
          {item.status === ShadowRunStatus.COMPLETED && item.asset_url && (
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(item);
              }}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
            >
              Download
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="shadow-analysis-container">
      <div className="shadow-analysis-header">
        <h1>Shadow Analysis</h1>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          Create Shadow Run
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="shadow-analysis-filters">
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

      <DataTable
        data={runs}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No shadow runs found"
      />

      <FormModal
        isOpen={isCreateModalOpen}
        title="Create Shadow Run"
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
          <label>Digital Twin (Optional)</label>
          <select
            className="select"
            value={formData.twin_id || ""}
            onChange={(e) => setFormData({ ...formData, twin_id: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">None</option>
            {twins.map((twin) => (
              <option key={twin.id} value={twin.id}>
                Twin #{twin.id}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Parameters (JSON) *</label>
          <textarea
            className="input"
            value={parametersJson}
            onChange={(e) => setParametersJson(e.target.value)}
            rows={10}
            style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            required
          />
          <small style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
            Enter valid JSON for shadow analysis parameters
          </small>
        </div>
      </FormModal>
    </div>
  );
};

export default ShadowAnalysis;
