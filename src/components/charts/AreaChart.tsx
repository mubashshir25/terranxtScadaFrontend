import React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  [key: string]: string | number | undefined;
}

interface AreaChartProps {
  data: DataPoint[];
  dataKey: string;
  name?: string;
  xAxisKey?: string;
  color?: string;
  unit?: string;
  height?: number;
  fillOpacity?: number;
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  name,
  xAxisKey = "timestamp",
  color = "var(--color-primary)",
  unit,
  height = 300,
  fillOpacity = 0.3,
}) => {
  const formatDate = (value: string | number | undefined) => {
    if (!value) return "";
    try {
      const dateStr = String(value);
      return format(new Date(dateStr), "HH:mm");
    } catch {
      return String(value);
    }
  };

  const formatTooltipValue = (value: number) => {
    return unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={formatDate}
          stroke="var(--color-muted)"
          style={{ fontSize: "0.75rem" }}
        />
        <YAxis
          stroke="var(--color-muted)"
          style={{ fontSize: "0.75rem" }}
          tickFormatter={(value) => formatTooltipValue(value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-surface-strong)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text)",
          }}
          labelFormatter={formatDate}
          formatter={(value: number) => formatTooltipValue(value)}
        />
        {name && <Legend />}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={`url(#gradient-${dataKey})`}
          strokeWidth={2}
          name={name}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
    </div>
  );
};

export default AreaChart;

