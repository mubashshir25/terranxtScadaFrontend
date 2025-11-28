import React from "react";
import "./MetricCard.css";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  onClick,
}) => {
  return (
    <div
      className={`metric-card glass ${onClick ? "clickable" : ""}`}
      onClick={onClick}
    >
      <div className="metric-card-header">
        <span className="metric-card-title">{title}</span>
        {icon && <div className="metric-card-icon">{icon}</div>}
      </div>
      <div className="metric-card-value">
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {trend && (
        <div
          className={`metric-trend ${trend.positive !== false ? "positive" : "negative"}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            {trend.positive !== false ? (
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            )}
          </svg>
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;

