import React from "react";
import "./StatusBadge.css";
import {
  AlarmSeverity,
  AlarmState,
  ReportStatus,
  ShadowRunStatus,
} from "../types/api";

interface StatusBadgeProps {
  status:
    | AlarmSeverity
    | AlarmState
    | ReportStatus
    | ShadowRunStatus
    | string;
  type?: "severity" | "state" | "report" | "shadow" | "default";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "default" }) => {
  const getStatusClass = () => {
    const statusStr = status.toLowerCase();

    if (type === "severity") {
      switch (statusStr) {
        case "critical":
          return "badge-critical";
        case "high":
          return "badge-high";
        case "medium":
          return "badge-medium";
        case "low":
          return "badge-low";
        default:
          return "badge-default";
      }
    }

    if (type === "state") {
      switch (statusStr) {
        case "open":
          return "badge-open";
        case "acknowledged":
          return "badge-acknowledged";
        case "closed":
          return "badge-closed";
        default:
          return "badge-default";
      }
    }

    if (type === "report" || type === "shadow") {
      switch (statusStr) {
        case "completed":
          return "badge-success";
        case "running":
        case "queued":
          return "badge-warning";
        case "failed":
          return "badge-error";
        case "pending":
          return "badge-info";
        default:
          return "badge-default";
      }
    }

    return "badge-default";
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;

