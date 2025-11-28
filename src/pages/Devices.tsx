import React, { useState, useEffect } from "react";
import { devicesService, DeviceGroup } from "../services/devices";
import { plantsService } from "../services/plants";
import DataTable, { Column } from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import { Device, Plant } from "../types/api";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Devices.css";

const deviceGroups: { key: DeviceGroup; label: string }[] = [
  { key: "inverters", label: "Inverters" },
  { key: "wms", label: "WMS Boxes" },
  { key: "string-monitoring", label: "String Monitoring" },
  { key: "abt-meters", label: "ABT Meters" },
];

const Devices: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState<Device[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DeviceGroup>("inverters");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Device | null>(null);
  const [formData, setFormData] = useState<Partial<Device>>({});

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadDevices();
  }, [selectedGroup]);

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
      const data = await devicesService.list(selectedGroup);
      setDevices(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await devicesService.create(selectedGroup, formData);
      setIsCreateModalOpen(false);
      setFormData({});
      loadDevices();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create device");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      await devicesService.update(selectedGroup, selectedDevice.id, formData);
      setIsEditModalOpen(false);
      setSelectedDevice(null);
      loadDevices();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update device");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await devicesService.delete(selectedGroup, deleteConfirm.id);
      setDeleteConfirm(null);
      loadDevices();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete device");
    }
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
    setFormData(device);
    setIsEditModalOpen(true);
  };

  const getColumns = (): Column<Device>[] => {
    const baseColumns: Column<Device>[] = [
      {
        key: "serial_number",
        header: "Serial Number",
        sortable: true,
      },
      {
        key: "operational",
        header: "Status",
        render: (item) => (
          <span style={{ color: item.operational ? "var(--color-success)" : "var(--color-error)" }}>
            {item.operational ? "Operational" : "Offline"}
          </span>
        ),
        sortable: true,
      },
    ];

    if (user?.role === "plant_admin") {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        render: (item) => (
          <div className="device-actions">
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
      });
    }

    return baseColumns;
  };

  return (
    <div className="devices-container">
      <div className="devices-header">
        <h1>Devices</h1>
        {user?.role === "plant_admin" && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            Create Device
          </button>
        )}
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="devices-tabs">
        {deviceGroups.map((group) => (
          <button
            key={group.key}
            className={`tab-button ${selectedGroup === group.key ? "active" : ""}`}
            onClick={() => setSelectedGroup(group.key)}
          >
            {group.label}
          </button>
        ))}
      </div>

      <DataTable
        data={devices}
        columns={getColumns()}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage={`No ${deviceGroups.find((g) => g.key === selectedGroup)?.label.toLowerCase()} found`}
      />

      {user?.role === "plant_admin" && (
        <>
          <FormModal
            isOpen={isCreateModalOpen}
            title={`Create ${deviceGroups.find((g) => g.key === selectedGroup)?.label}`}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreate}
          >
            <div className="form-group">
              <label>Plant ID *</label>
              <select
                className="select"
                value={formData.plant_id || ""}
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
              <label>Serial Number *</label>
              <input
                className="input"
                type="text"
                value={formData.serial_number || ""}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Operational</label>
              <select
                className="select"
                value={formData.operational !== undefined ? String(formData.operational) : "true"}
                onChange={(e) => setFormData({ ...formData, operational: e.target.value === "true" })}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </FormModal>

          <FormModal
            isOpen={isEditModalOpen}
            title={`Edit ${deviceGroups.find((g) => g.key === selectedGroup)?.label}`}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedDevice(null);
            }}
            onSubmit={handleUpdate}
          >
            <div className="form-group">
              <label>Serial Number</label>
              <input
                className="input"
                type="text"
                value={formData.serial_number || ""}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Operational</label>
              <select
                className="select"
                value={formData.operational !== undefined ? String(formData.operational) : "true"}
                onChange={(e) => setFormData({ ...formData, operational: e.target.value === "true" })}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </FormModal>

          <ConfirmDialog
            isOpen={!!deleteConfirm}
            title="Delete Device"
            message={`Are you sure you want to delete device "${deleteConfirm?.serial_number}"? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            variant="danger"
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        </>
      )}
    </div>
  );
};

export default Devices;
