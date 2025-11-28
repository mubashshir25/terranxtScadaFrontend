// Enums matching backend models
export enum UserRole {
  PLANT_ADMIN = "plant_admin",
  ENGINEER = "engineer",
  OPERATOR = "operator",
  VIEWER = "viewer",
}

export enum AlarmSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AlarmState {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
  CLOSED = "closed",
}

export enum DeviceType {
  INVERTER = "inverter",
  WMS = "wms_box",
  STRING_MONITOR = "string_monitoring_box",
  ABT_METER = "abt_meter",
}

export enum ReportType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

export enum ReportStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum ForecastHorizon {
  DAY_AHEAD = "day_ahead",
  WEEK_AHEAD = "week_ahead",
  MONTH_AHEAD = "month_ahead",
}

export enum ShadowRunStatus {
  QUEUED = "queued",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Base types
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

// Plant types
export interface Plant extends Timestamps {
  id: number;
  plant_code: number;
  timezone: string;
  latitude: number;
  longitude: number;
  total_power_output_kw: number;
  name?: string;
  db_plant_id?: number;
  elevation_m?: number;
  no_of_inverters?: number;
  no_of_panels?: number;
  panel_per_string?: number;
  string_per_row?: number;
  string_per_inverter?: number;
  power_output_per_inverter_kw?: number;
  power_output_per_panel_kw?: number;
  axis_tilt?: number;
  axis_azimuth?: number;
  max_angle?: number;
  backtrack?: boolean;
  tracking?: string;
  total_area_m2?: number;
  gcr?: number;
}

export interface PlantCreate {
  plant_code: number;
  timezone: string;
  latitude: number;
  longitude: number;
  total_power_output_kw: number;
  name?: string;
  db_plant_id?: number;
  elevation_m?: number;
  no_of_inverters?: number;
  no_of_panels?: number;
  panel_per_string?: number;
  string_per_row?: number;
  string_per_inverter?: number;
  power_output_per_inverter_kw?: number;
  power_output_per_panel_kw?: number;
  axis_tilt?: number;
  axis_azimuth?: number;
  max_angle?: number;
  backtrack?: boolean;
  tracking?: string;
  total_area_m2?: number;
  gcr?: number;
}

export interface PlantUpdate {
  name?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  total_power_output_kw?: number;
  no_of_inverters?: number;
  no_of_panels?: number;
  panel_per_string?: number;
  string_per_row?: number;
  string_per_inverter?: number;
  power_output_per_inverter_kw?: number;
  power_output_per_panel_kw?: number;
  axis_tilt?: number;
  axis_azimuth?: number;
  max_angle?: number;
  backtrack?: boolean;
  tracking?: string;
  total_area_m2?: number;
  gcr?: number;
}

// Alarm types
export interface Alarm {
  id: number;
  plant_id: number;
  title: string;
  message: string;
  severity: AlarmSeverity;
  state: AlarmState;
  device_type?: string;
  device_id?: number;
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: number;
  closed_at?: string;
  closed_by?: number;
  metadata?: Record<string, any>;
}

export interface AlarmCreate {
  plant_id: number;
  title: string;
  message: string;
  severity?: AlarmSeverity;
  device_type?: string;
  device_id?: number;
  metadata?: Record<string, any>;
}

export interface AlarmUpdate {
  state?: AlarmState;
  severity?: AlarmSeverity;
  message?: string;
  acknowledged?: boolean;
  closed?: boolean;
  metadata?: Record<string, any>;
}

// Device Snapshot types
export interface DeviceSnapshot {
  id: number;
  plant_id: number;
  device_type: DeviceType;
  device_id: number;
  recorded_at: string;
  metric_summary: Record<string, any>;
  source?: string;
}

export interface DeviceSnapshotCreate {
  plant_id: number;
  device_type: DeviceType;
  device_id: number;
  metric_summary: Record<string, any>;
  recorded_at?: string;
  source?: string;
}

// Report types
export interface ReportJob extends Timestamps {
  id: number;
  plant_id?: number;
  name: string;
  description?: string;
  report_type: ReportType;
  schedule?: string;
  status: ReportStatus;
  requested_by?: number;
  params?: Record<string, any>;
  artifact_url?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ReportJobCreate {
  plant_id?: number;
  name: string;
  report_type: ReportType;
  schedule?: string;
  description?: string;
  params?: Record<string, any>;
}

// Generation Forecast types
export interface GenerationForecast extends Timestamps {
  id: number;
  plant_id: number;
  forecast_date: string;
  horizon: ForecastHorizon;
  data_points: Array<Record<string, any>>;
  summary?: Record<string, any>;
  generated_by?: number;
}

export interface GenerationForecastCreate {
  plant_id: number;
  forecast_date: string;
  horizon: ForecastHorizon;
  data_points: Array<Record<string, any>>;
  summary?: Record<string, any>;
}

// Shadow Run types
export interface ShadowRun extends Timestamps {
  id: number;
  plant_id: number;
  twin_id?: number;
  requested_by?: number;
  status: ShadowRunStatus;
  parameters: Record<string, any>;
  result_summary?: Record<string, any>;
  asset_url?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ShadowRunCreate {
  plant_id: number;
  twin_id?: number;
  parameters: Record<string, any>;
}

// Digital Twin types
export interface DigitalTwin extends Timestamps {
  id: number;
  plant_id: number;
  twin_data: Record<string, any>;
}

export interface DigitalTwinCreate {
  plant_id: number;
  twin_data: Record<string, any>;
}

export interface DigitalTwinUpdate {
  twin_data?: Record<string, any>;
}

export interface ThreeJSScriptResponse {
  script: string;
  twin_id: number;
  plant_id: number;
}

// User Settings types
export interface UserSetting extends Timestamps {
  id: number;
  user_id: number;
  default_plant_id?: number;
  theme?: "light" | "dark";
  notifications?: Record<string, any>;
  preferences?: Record<string, any>;
}

export interface UserSettingUpdate {
  default_plant_id?: number;
  theme?: "light" | "dark";
  notifications?: Record<string, any>;
  preferences?: Record<string, any>;
}

// Dashboard types
export interface DashboardOverview {
  plant: {
    id: number;
    name?: string;
    output_kw: number;
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metrics: {
    live_irradiance?: number;
    temperature_c?: number;
    total_power_kw: number;
    alarm_counts: Record<string, number>;
  };
}

export interface PowerSeriesPoint {
  timestamp: string;
  power_kw: number;
  [key: string]: string | number | undefined;
}

export interface DailyEnergyPoint {
  date: string;
  energy_mwh: number;
  [key: string]: string | number | undefined;
}

// Device types (for devices endpoint)
export interface Inverter {
  id: number;
  plant_id: number;
  serial_number: string;
  db_id?: number;
  onboarding_date?: string;
  operational: boolean;
  db_table_name?: string;
  model_name?: string;
  nominal_output_power_kw?: number;
  // ... other fields
  [key: string]: any;
}

export interface WmsBox {
  id: number;
  serial_number: string;
  db_id?: number;
  onboarding_date?: string;
  operational: boolean;
  db_table_name?: string;
  [key: string]: any;
}

export interface StringMonitoringBox {
  id: number;
  serial_number: string;
  db_id?: number;
  onboarding_date?: string;
  operational: boolean;
  db_table_name?: string;
  p_kwp?: number;
  temp_c?: number;
  no_strings?: number;
  strings_status?: Record<string, any>;
  strings_data?: Record<string, any>;
  [key: string]: any;
}

export interface AbtMeter {
  id: number;
  serial_number: string;
  db_id?: number;
  onboarding_date?: string;
  operational: boolean;
  db_table_name?: string;
  model_name?: string;
  phase_voltage_v?: number;
  phase_current_a?: number;
  phase_power_factor?: number;
  phase_frequency_hz?: number;
  phase_voltage_unbalance_pct?: number;
  phase_current_unbalance_pct?: number;
  [key: string]: any;
}

export type Device = Inverter | WmsBox | StringMonitoringBox | AbtMeter;

// API Response types
export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

export interface DeviceMetricsHistory {
  device_type: string;
  device_id: number;
  history: Array<{
    timestamp: string;
    metrics: Record<string, any>;
  }>;
}

