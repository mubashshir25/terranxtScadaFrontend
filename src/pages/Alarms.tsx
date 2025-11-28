import React, { useState, useEffect, useContext } from "react";
import { alarmsService } from "../services/alarms";
import { plantsService } from "../services/plants";
import DataTable, { Column } from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import { Alarm, Plant, AlarmCreate, AlarmUpdate, AlarmState, AlarmSeverity } from "../types/api";
import { format } from "date-fns";
import { AuthContext } from "../context/AuthContext";
import "./Alarms.css";

const Alarms: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>();
  const [selectedState, setSelectedState] = useState<AlarmState | undefined>();
  const [selectedSeverity, setSelectedSeverity] = useState<AlarmSeverity | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Alarm | null>(null);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);

  const [formData, setFormData] = useState<AlarmCreate>({
    plant_id: 0,
    title: "",
    message: "",
    severity: AlarmSeverity.MEDIUM,
  });

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadAlarms();
  }, [selectedPlantId, selectedState, selectedSeverity]);

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

  const loadAlarms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alarmsService.list(selectedPlantId, selectedState, selectedSeverity);
      setAlarms(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load alarms");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await alarmsService.create(formData);
      setIsCreateModalOpen(false);
      setFormData({
        plant_id: plants[0]?.id || 0,
        title: "",
        message: "",
        severity: AlarmSeverity.MEDIUM,
      });
      loadAlarms();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create alarm");
    }
  };

  const handleAcknowledge = async (alarm: Alarm) => {
    try {
      await alarmsService.update(alarm.id, { acknowledged: true });
      loadAlarms();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to acknowledge alarm");
    }
  };

  const handleClose = async (alarm: Alarm) => {
    try {
      await alarmsService.update(alarm.id, { closed: true });
      loadAlarms();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to close alarm");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await alarmsService.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      loadAlarms();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete alarm");
    }
  };

  const columns: Column<Alarm>[] = [
    {
      key: "severity",
      header: "Severity",
      render: (item) => <StatusBadge status={item.severity} type="severity" />,
      sortable: true,
    },
    {
      key: "state",
      header: "State",
      render: (item) => <StatusBadge status={item.state} type="state" />,
      sortable: true,
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
    },
    {
      key: "message",
      header: "Message",
      render: (item) => (
        <span style={{ maxWidth: "300px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.message}
        </span>
      ),
    },
    {
      key: "triggered_at",
      header: "Triggered",
      render: (item) => format(new Date(item.triggered_at), "MMM dd, yyyy HH:mm"),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="alarm-actions">
          {item.state === AlarmState.OPEN && (
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleAcknowledge(item);
              }}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
            >
              Acknowledge
            </button>
          )}
          {item.state !== AlarmState.CLOSED && (
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(item);
              }}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
            >
              Close
            </button>
          )}
          {user?.role === "plant_admin" && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="alarms-container">
      <div className="alarms-header">
        <h1>Alarms</h1>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          Create Alarm
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="alarms-filters">
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

        <select
          className="select"
          value={selectedState || ""}
          onChange={(e) => setSelectedState(e.target.value as AlarmState || undefined)}
          style={{ width: "auto", minWidth: "200px" }}
        >
          <option value="">All States</option>
          <option value={AlarmState.OPEN}>Open</option>
          <option value={AlarmState.ACKNOWLEDGED}>Acknowledged</option>
          <option value={AlarmState.CLOSED}>Closed</option>
        </select>

        <select
          className="select"
          value={selectedSeverity || ""}
          onChange={(e) => setSelectedSeverity(e.target.value as AlarmSeverity || undefined)}
          style={{ width: "auto", minWidth: "200px" }}
        >
          <option value="">All Severities</option>
          <option value={AlarmSeverity.LOW}>Low</option>
          <option value={AlarmSeverity.MEDIUM}>Medium</option>
          <option value={AlarmSeverity.HIGH}>High</option>
          <option value={AlarmSeverity.CRITICAL}>Critical</option>
        </select>
      </div>

      <DataTable
        data={alarms}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={setSelectedAlarm}
        loading={loading}
        emptyMessage="No alarms found"
      />

      <FormModal
        isOpen={isCreateModalOpen}
        title="Create Alarm"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      >
        <div className="form-group">
          <label>Plant</label>
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
          <label>Title</label>
          <input
            className="input"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea
            className="input"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
            required
          />
        </div>
        <div className="form-group">
          <label>Severity</label>
          <select
            className="select"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlarmSeverity })}
          >
            <option value={AlarmSeverity.LOW}>Low</option>
            <option value={AlarmSeverity.MEDIUM}>Medium</option>
            <option value={AlarmSeverity.HIGH}>High</option>
            <option value={AlarmSeverity.CRITICAL}>Critical</option>
          </select>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Alarm"
        message={`Are you sure you want to delete the alarm "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default Alarms;
