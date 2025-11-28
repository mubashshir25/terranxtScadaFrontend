import React from "react";
import "./ChartCard.css";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  children,
  actions,
  className = "",
}) => {
  return (
    <div className={`chart-card glass ${className}`}>
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {actions && <div className="chart-card-actions">{actions}</div>}
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  );
};

export default ChartCard;

