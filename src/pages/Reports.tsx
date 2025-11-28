import React, { useState, useEffect } from "react";
import { reportsService } from "../services/reports";
import { plantsService } from "../services/plants";
import DataTable, { Column } from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import StatusBadge from "../components/StatusBadge";
import FormModal from "../components/FormModal";
import { ReportJob, Plant, ReportJobCreate, ReportType, ReportStatus } from "../types/api";
import { format } from "date-fns";
import "./Reports.css";

const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportJob[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReportJobCreate>({
    name: "",
    report_type: ReportType.DAILY,
  });

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadReports();
  }, [selectedPlantId]);

  const loadPlants = async () => {
    try {
      const data = await plantsService.list();
      setPlants(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load plants");
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsService.list(selectedPlantId);
      setReports(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reportsService.create(formData);
      setIsCreateModalOpen(false);
      setFormData({ name: "", report_type: ReportType.DAILY });
      loadReports();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create report");
    }
  };

  const handleDownload = (report: ReportJob) => {
    if (report.artifact_url) {
      window.open(report.artifact_url, "_blank");
    }
  };

  const columns: Column<ReportJob>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
    },
    {
      key: "report_type",
      header: "Type",
      render: (item) => (
        <span style={{ textTransform: "capitalize" }}>{item.report_type}</span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} type="report" />,
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
        <div className="report-actions">
          {item.status === ReportStatus.COMPLETED && item.artifact_url && (
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
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reports</h1>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          Create Report
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="reports-filters">
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
        data={reports}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No reports found"
      />

      <FormModal
        isOpen={isCreateModalOpen}
        title="Create Report"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      >
        <div className="form-group">
          <label>Plant (Optional)</label>
          <select
            className="select"
            value={formData.plant_id || ""}
            onChange={(e) => setFormData({ ...formData, plant_id: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">All Plants</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name || `Plant ${plant.plant_code}`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Report Type</label>
          <select
            className="select"
            value={formData.report_type}
            onChange={(e) => setFormData({ ...formData, report_type: e.target.value as ReportType })}
          >
            <option value={ReportType.DAILY}>Daily</option>
            <option value={ReportType.WEEKLY}>Weekly</option>
            <option value={ReportType.MONTHLY}>Monthly</option>
            <option value={ReportType.CUSTOM}>Custom</option>
          </select>
        </div>
        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            className="input"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Schedule (Optional)</label>
          <input
            className="input"
            type="text"
            value={formData.schedule || ""}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            placeholder="Cron expression or ISO duration"
          />
        </div>
      </FormModal>
    </div>
  );
};

export default Reports;
