import React, { useState, useEffect } from "react";
import { plantsService } from "../services/plants";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import { Plant, PlantCreate, PlantUpdate } from "../types/api";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { format } from "date-fns";
import "./Plants.css";

const Plants: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Plant | null>(null);
  const [formData, setFormData] = useState<PlantCreate>({
    plant_code: 0,
    timezone: "UTC",
    latitude: 0,
    longitude: 0,
    total_power_output_kw: 0,
  });

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await plantsService.list();
      setPlants(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await plantsService.create(formData);
      setIsCreateModalOpen(false);
      setFormData({
        plant_code: 0,
        timezone: "UTC",
        latitude: 0,
        longitude: 0,
        total_power_output_kw: 0,
      });
      loadPlants();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create plant");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlant) return;
    try {
      const update: PlantUpdate = {
        name: formData.name,
        timezone: formData.timezone,
        latitude: formData.latitude,
        longitude: formData.longitude,
        total_power_output_kw: formData.total_power_output_kw,
      };
      await plantsService.update(selectedPlant.id, update);
      setIsEditModalOpen(false);
      setSelectedPlant(null);
      loadPlants();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update plant");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await plantsService.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      loadPlants();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete plant");
    }
  };

  const openEditModal = (plant: Plant) => {
    setSelectedPlant(plant);
    setFormData({
      plant_code: plant.plant_code,
      name: plant.name,
      timezone: plant.timezone,
      latitude: plant.latitude,
      longitude: plant.longitude,
      total_power_output_kw: plant.total_power_output_kw,
      no_of_inverters: plant.no_of_inverters,
      no_of_panels: plant.no_of_panels,
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="plants-container">
        <LoadingSpinner message="Loading plants..." />
      </div>
    );
  }

  return (
    <div className="plants-container">
      <div className="plants-header">
        <h1>Plants</h1>
        {user?.role === "plant_admin" && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            Create Plant
          </button>
        )}
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="plants-grid">
        {plants.map((plant) => (
          <div key={plant.id} className="plant-card glass">
            <div className="plant-card-header">
              <h3>{plant.name || `Plant ${plant.plant_code}`}</h3>
              {user?.role === "plant_admin" && (
                <div className="plant-card-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => openEditModal(plant)}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => setDeleteConfirm(plant)}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="plant-card-body">
              <div className="plant-info">
                <span className="plant-label">Code:</span>
                <span>{plant.plant_code}</span>
              </div>
              <div className="plant-info">
                <span className="plant-label">Power Output:</span>
                <span>{plant.total_power_output_kw.toFixed(2)} kW</span>
              </div>
              <div className="plant-info">
                <span className="plant-label">Location:</span>
                <span>{plant.latitude.toFixed(4)}, {plant.longitude.toFixed(4)}</span>
              </div>
              <div className="plant-info">
                <span className="plant-label">Created:</span>
                <span>{format(new Date(plant.created_at), "MMM dd, yyyy")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plants.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-muted)" }}>
          No plants found
        </div>
      )}

      <FormModal
        isOpen={isCreateModalOpen}
        title="Create Plant"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      >
        <div className="form-group">
          <label>Plant Code *</label>
          <input
            className="input"
            type="number"
            value={formData.plant_code || ""}
            onChange={(e) => setFormData({ ...formData, plant_code: Number(e.target.value) })}
            required
          />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            type="text"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Timezone *</label>
          <input
            className="input"
            type="text"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Latitude *</label>
            <input
              className="input"
              type="number"
              step="any"
              value={formData.latitude || ""}
              onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>Longitude *</label>
            <input
              className="input"
              type="number"
              step="any"
              value={formData.longitude || ""}
              onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Total Power Output (kW) *</label>
          <input
            className="input"
            type="number"
            step="any"
            value={formData.total_power_output_kw || ""}
            onChange={(e) => setFormData({ ...formData, total_power_output_kw: Number(e.target.value) })}
            required
          />
        </div>
      </FormModal>

      <FormModal
        isOpen={isEditModalOpen}
        title="Edit Plant"
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPlant(null);
        }}
        onSubmit={handleUpdate}
      >
        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            type="text"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Timezone</label>
          <input
            className="input"
            type="text"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Latitude</label>
            <input
              className="input"
              type="number"
              step="any"
              value={formData.latitude || ""}
              onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input
              className="input"
              type="number"
              step="any"
              value={formData.longitude || ""}
              onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Total Power Output (kW)</label>
          <input
            className="input"
            type="number"
            step="any"
            value={formData.total_power_output_kw || ""}
            onChange={(e) => setFormData({ ...formData, total_power_output_kw: Number(e.target.value) })}
          />
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Plant"
        message={`Are you sure you want to delete "${deleteConfirm?.name || `Plant ${deleteConfirm?.plant_code}`}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default Plants;
