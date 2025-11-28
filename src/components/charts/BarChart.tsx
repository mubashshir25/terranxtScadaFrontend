import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
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

interface BarChartProps {
  data: DataPoint[];
  dataKey: string;
  name?: string;
  xAxisKey?: string;
  color?: string;
  unit?: string;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  name,
  xAxisKey = "date",
  color = "var(--color-primary)",
  unit,
  height = 300,
}) => {
  const formatDate = (value: string | number | undefined) => {
    if (!value) return "";
    try {
      const dateStr = String(value);
      return format(new Date(dateStr), "MMM dd");
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
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
        <Bar dataKey={dataKey} fill={color} name={name} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
    </div>
  );
};

export default BarChart;

