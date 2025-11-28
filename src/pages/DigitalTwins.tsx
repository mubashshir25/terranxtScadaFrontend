import React, { useState, useEffect } from "react";
import { digitalTwinsService } from "../services/digitalTwins";
import { plantsService } from "../services/plants";
import DataTable, { Column } from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import { DigitalTwin, Plant, DigitalTwinCreate, DigitalTwinUpdate } from "../types/api";
import { format } from "date-fns";
import "./DigitalTwins.css";

const DigitalTwins: React.FC = () => {
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTwin, setSelectedTwin] = useState<DigitalTwin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DigitalTwin | null>(null);
  const [formData, setFormData] = useState<DigitalTwinCreate>({
    plant_id: 0,
    twin_data: {
      scene: {
        objects: [],
        lights: [],
        cameras: [],
      },
    },
  });
  const [twinDataJson, setTwinDataJson] = useState("");

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadTwins();
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

  const loadTwins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await digitalTwinsService.list(selectedPlantId);
      setTwins(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load digital twins");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let twinData = formData.twin_data;
      if (twinDataJson) {
        try {
          twinData = JSON.parse(twinDataJson);
        } catch {
          setError("Invalid JSON format");
          return;
        }
      }
      await digitalTwinsService.create({ ...formData, twin_data: twinData });
      setIsCreateModalOpen(false);
      setFormData({
        plant_id: plants[0]?.id || 0,
        twin_data: { scene: { objects: [], lights: [], cameras: [] } },
      });
      setTwinDataJson("");
      loadTwins();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create digital twin");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTwin) return;
    try {
      let twinData = selectedTwin.twin_data;
      if (twinDataJson) {
        try {
          twinData = JSON.parse(twinDataJson);
        } catch {
          setError("Invalid JSON format");
          return;
        }
      }
      await digitalTwinsService.update(selectedTwin.id, { twin_data: twinData });
      setIsEditModalOpen(false);
      setSelectedTwin(null);
      setTwinDataJson("");
      loadTwins();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update digital twin");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await digitalTwinsService.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      loadTwins();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete digital twin");
    }
  };

  const openEditModal = (twin: DigitalTwin) => {
    setSelectedTwin(twin);
    setTwinDataJson(JSON.stringify(twin.twin_data, null, 2));
    setIsEditModalOpen(true);
  };

  const columns: Column<DigitalTwin>[] = [
    {
      key: "id",
      header: "ID",
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
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="twin-actions">
          <button
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
          >
            Edit
          </button>
          <button
            className="btn btn-danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(item);
            }}
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="digital-twins-container">
      <div className="digital-twins-header">
        <h1>Digital Twins</h1>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          Create Digital Twin
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="digital-twins-filters">
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
        data={twins}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No digital twins found"
      />

      <FormModal
        isOpen={isCreateModalOpen}
        title="Create Digital Twin"
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
          <label>Twin Data (JSON) *</label>
          <textarea
            className="input"
            value={twinDataJson || JSON.stringify(formData.twin_data, null, 2)}
            onChange={(e) => setTwinDataJson(e.target.value)}
            rows={15}
            style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            required
          />
          <small style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
            Enter valid JSON for the digital twin scene data
          </small>
        </div>
      </FormModal>

      <FormModal
        isOpen={isEditModalOpen}
        title="Edit Digital Twin"
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTwin(null);
          setTwinDataJson("");
        }}
        onSubmit={handleUpdate}
        size="large"
      >
        <div className="form-group">
          <label>Twin Data (JSON) *</label>
          <textarea
            className="input"
            value={twinDataJson}
            onChange={(e) => setTwinDataJson(e.target.value)}
            rows={15}
            style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            required
          />
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Digital Twin"
        message={`Are you sure you want to delete digital twin #${deleteConfirm?.id}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default DigitalTwins;
