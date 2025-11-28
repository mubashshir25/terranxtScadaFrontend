# Plan required APIs for application sections
_Exported on 11/28/2025 at 15:51:53 GMT+5:30 from Cursor (2.0.77)_

---

**User**

make the proper APIS in the application to provide the support for the following sections of my application 



Dashboard
Monitoring
Alarms
Reports
Plants
Devices
Digital Twins
Predicted Generation
Shadow Analysis
Setting



if already there then no problem 



the attached image details how my frontend looks like the central panel is the one that changes on changing the tabs 

plan first that which APIS will be needed to support this application 

---

**Cursor**

1. What backend stack are we targeting for the APIs?  
   - a) Node/Nest  
   - b) Node/Express  
   - c) Python/FastAPI  
   - d) .NET  
   - e) Something else (please specify)

2. Do the modules share a common data source (one DB) or separate services per domain?  
   - a) Single DB  
   - b) Multiple services

3. Any must-have auth/role model for these endpoints (e.g., JWT with admin/user roles)?

---

**User**

backend stack is c) Python/FastAPI

 as you can see in @app.py 



the data source is a common data source which is postgres detailed in the @docker-compose.yml 



most of the basic endpoints like auth and user is already defined check the @src for information now only do the extra ones that are required 

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

```python
"""SQLAlchemy models for static solar plant metadata.

The schema focuses on CRUD-friendly tables that can persist the same
information contained in ``config.json`` while remaining flexible for
partial records. Only mission-critical identifiers and capacity figures
are marked as non-nullable; everything else can be filled incrementally.
"""

from __future__ import annotations

from datetime import datetime, date
import enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Text,
)
from sqlalchemy.orm import relationship
from src.database import Base


class TimestampMixin:
    """Simple mixin to track creation and update timestamps."""

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )

class UserRole(str, enum.Enum):
    PLANT_ADMIN = "plant_admin"
    ENGINEER = "engineer"
    OPERATOR = "operator"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, native_enum=False, length=50), default=UserRole.OPERATOR, nullable=False)

    def __repr__(self):
        return f"User(id={self.id}, username={self.username}, email={self.email}, role={self.role})"
    

# make one more table called plants for user
class PlantUser(Base, TimestampMixin):
    __tablename__ = "plant_users"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)

class Plant(Base, TimestampMixin):
    """High-level information about a solar plant site."""

    __tablename__ = "plants"

    id = Column(Integer, primary_key=True)
    plant_code = Column(Integer, nullable=False, unique=True)  # matches config plant_id
    db_plant_id = Column(Integer)
    name = Column(String(128))
    timezone = Column(String(64), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float)
    total_power_output_kw = Column(Float, nullable=False)
    no_of_inverters = Column(Integer)
    no_of_panels = Column(Integer)
    # panel_per_row = Column(Integer)
    # total_no_rows = Column(Integer)
    panel_per_string = Column(Integer)
    string_per_row = Column(Integer) # for physical properties
    string_per_inverter = Column(Integer) # for electrical properties
    power_output_per_inverter_kw = Column(Float)
    power_output_per_panel_kw = Column(Float)
    axis_tilt = Column(Float)
    axis_azimuth = Column(Float)
    max_angle = Column(Float)
    backtrack = Column(Boolean)
    tracking = Column(String(32))
    total_area_m2 = Column(Float)
    gcr = Column(Float)

    panel_specs = relationship(
        "PanelSpec",
        back_populates="plant",
        cascade="all, delete-orphan",
    )
    inverters = relationship(
        "Inverter",
        back_populates="plant",
        cascade="all, delete-orphan",
    )
    digital_twins = relationship(
        "DigitalTwin",
        back_populates="plant",
        cascade="all, delete-orphan",
    )
    alarms = relationship("Alarm", back_populates="plant", cascade="all, delete-orphan")
    device_snapshots = relationship("DeviceSnapshot", back_populates="plant", cascade="all, delete-orphan")
    generation_forecasts = relationship("GenerationForecast", back_populates="plant", cascade="all, delete-orphan")
    shadow_runs = relationship("ShadowRun", back_populates="plant", cascade="all, delete-orphan")
    report_jobs = relationship("ReportJob", back_populates="plant", cascade="all, delete-orphan")


class PanelSpec(Base, TimestampMixin):
    """Electrical panel specification tied to a plant."""

    __tablename__ = "panel_specs"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    p_max_w = Column(Float, nullable=False)
    v_oc_v = Column(Float)
    i_sc_a = Column(Float)
    v_mp_v = Column(Float)
    i_mp_a = Column(Float)
    efficiency_pct = Column(Float, nullable=False)
    p_selection = Column(Integer)
    t_noct_c = Column(Float)
    max_system_voltage_v = Column(Integer, nullable=False)
    max_series_fuse_rating_a = Column(Integer, nullable=False)
    operating_temperature_min_c = Column(Float)
    operating_temperature_max_c = Column(Float)
    stc_irradiance_w_m2 = Column(Integer)
    stc_temperature_c = Column(Float)
    p_max_noct_w = Column(Float)
    v_oc_noct_v = Column(Float)
    i_sc_noct_a = Column(Float)
    v_mp_noct_v = Column(Float)
    i_mp_noct_a = Column(Float)
    tolerance_p_max_pct = Column(Float)
    tolerance_v_oc_pct = Column(Float)
    tolerance_i_sc_pct = Column(Float)
    panel_type = Column(String(64), nullable=False)
    cell_count = Column(Integer)
    dimension_length_mm = Column(Float)
    dimension_width_mm = Column(Float)
    dimension_depth_mm = Column(Float)
    weight_kg = Column(Float)
    front_glass = Column(String(128))
    frame = Column(String(128))
    junction_box = Column(String(64))
    coefficient_pmax_pct = Column(Float)
    coefficient_voc_pct = Column(Float)
    coefficient_isc_pct = Column(Float)
    wind_pa = Column(Float)
    snow_pa = Column(Float)
    safety_factor = Column(Float)
    product_years = Column(Integer)
    performance_years = Column(Integer)
    manufacturer_name = Column(String(64))
    manufacture_date = Column(Date)
    
    plant = relationship("Plant", back_populates="panel_specs")

class Inverter(Base, TimestampMixin):
    """Individual inverter static information."""

    __tablename__ = "inverters"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    serial_number = Column(String(64), nullable=False, unique=True)
    db_id = Column(Integer)
    onboarding_date = Column(Date)
    operational = Column(Boolean, default=True)
    db_table_name = Column(String(128))
    model_name = Column(String(64))
    nominal_output_power_kw = Column(Float)
    nominal_output_current_a = Column(Float)
    max_output_connections = Column(Integer)
    max_pv_power_dc_kw = Column(Float)
    max_nominal_input_current_a = Column(Float)
    max_allowed_pv_current_a = Column(Float)
    max_dc_connections_1mppt = Column(Integer)
    max_efficiency_pct = Column(Float)
    european_efficiency_pct = Column(Float)
    power_consumption_night_kw = Column(Float)
    dimension_length_mm = Column(Float)
    dimension_width_mm = Column(Float)
    dimension_depth_mm = Column(Float)
    weight_kg = Column(Float)
    airflow_required_m3ph = Column(Float)
    mpp_range_min_v = Column(Float)
    mpp_range_max_v = Column(Float)
    max_input_v = Column(Float)
    nominal_output_ac_v = Column(Float)
    phases = Column(Integer)
    power_factor_min = Column(Float)
    power_factor_max = Column(Float)
    temp_range_min_c = Column(Float)
    temp_range_max_c = Column(Float)

    plant = relationship("Plant", back_populates="inverters")
    transient_spec = relationship(
        "InverterTransientSpec",
        uselist=False,
        back_populates="inverter",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("plant_id", "serial_number", name="uq_inverter_plant_serial"),
    )


class InverterTransientSpec(Base, TimestampMixin):
    """Default transient/telemetry settings for an inverter."""

    __tablename__ = "inverter_transient_specs"

    id = Column(Integer, primary_key=True)
    inverter_id = Column(
        Integer,
        ForeignKey("inverters.id"),
        nullable=False,
        unique=True,
    )
    todays_energy_kwh = Column(Float)
    monthly_energy_kwh = Column(Float)
    total_energy_kwh = Column(Float)
    
    typical_current_output_a = Column(Float)
    typical_voltage_output_v = Column(Float)
    typical_power_output_kw = Column(Float)
    
    health_status = Column(String(32))
    
    efficiency_pct = Column(Float)
    temperature_c = Column(Float)
    power_factor = Column(Float)
    status = Column(String(32))
    error_code = Column(String(128))
    fault_code = Column(String(128))

    inverter = relationship("Inverter", back_populates="transient_spec")

class Abt_meter(Base, TimestampMixin):
    """ABT meter information."""
    __tablename__ = "abt_meters"
    id = Column(Integer, primary_key=True)
    serial_number = Column(String(64), nullable=False, unique=True)
    db_id = Column(Integer)
    onboarding_date = Column(Date)
    operational = Column(Boolean, default=True)
    db_table_name = Column(String(128))
    model_name = Column(String(64))
    phase_voltage_v = Column(Float)
    phase_current_a = Column(Float)    
    phase_power_factor = Column(Float)
    phase_frequency_hz = Column(Float)
    phase_voltage_unbalance_pct = Column(Float)
    phase_current_unbalance_pct = Column(Float)

class Wms_box(Base, TimestampMixin):
    """WMS box information."""
    __tablename__ = "wms_boxes"
    id = Column(Integer, primary_key=True)
    serial_number = Column(String(64), nullable=False, unique=True)
    db_id = Column(Integer)
    onboarding_date = Column(Date)
    operational = Column(Boolean, default=True)
    db_table_name = Column(String(128))

class String_monitoring_box(Base, TimestampMixin):
    """String monitoring box information."""
    __tablename__ = "string_monitoring_boxes"
    id = Column(Integer, primary_key=True)
    serial_number = Column(String(64), nullable=False, unique=True)
    db_id = Column(Integer)
    onboarding_date = Column(Date)
    operational = Column(Boolean, default=True)
    db_table_name = Column(String(128))
    p_kwp = Column(Float)
    temp_c = Column(Float)
    no_strings = Column(Integer)
    strings_status = Column(JSONB)
    strings_data = Column(JSONB)

class DigitalTwin(Base, TimestampMixin):
    """Digital twin model for 3D scene visualization.
    
    Stores flexible JSONB data representing a 3D digital twin of a solar plant.
    The twin_data field can contain any valid JSON structure, but a suggested
    schema is:
    
    {
        "scene": {
            "objects": [
                {
                    "type": "solar_panel" | "inverter" | "structure" | "ground",
                    "position": [x, y, z],
                    "rotation": [x, y, z],
                    "scale": [x, y, z],
                    "dimensions": {"length": float, "width": float, "height": float},
                    "material": {"color": "#hex", "opacity": float, "metalness": float, "roughness": float},
                    "metadata": {}
                }
            ],
            "lights": [
                {
                    "type": "ambient" | "directional" | "point" | "spot",
                    "position": [x, y, z],
                    "color": "#hex",
                    "intensity": float
                }
            ],
            "cameras": [
                {
                    "type": "perspective" | "orthographic",
                    "position": [x, y, z],
                    "target": [x, y, z],
                    "fov": float
                }
            ],
            "environment": {
                "background": "#hex" | "url",
                "fog": {"color": "#hex", "near": float, "far": float}
            }
        }
    }
    
    The generate_threejs_script() method converts this JSON structure into
    a React Three Fiber compatible script that can be used in the frontend.
    """
    
    __tablename__ = "digital_twins"
    
    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    twin_data = Column(JSONB, nullable=False)
    
    plant = relationship("Plant", back_populates="digital_twins")
    
    def generate_threejs_script(self) -> str:
        """Generate a React Three Fiber script from the twin_data JSONB.
        
        Converts the stored JSON structure into a valid React Three Fiber
        component code that can be used directly in the React frontend.
        
        Returns:
            str: React Three Fiber script as a string
        """
        import json
        
        if not self.twin_data:
            return "// No twin data available"
        
        data = self.twin_data if isinstance(self.twin_data, dict) else json.loads(self.twin_data) if isinstance(self.twin_data, str) else {}
        scene = data.get("scene", {})
        
        script_lines = [
            "import { Canvas } from '@react-three/fiber';",
            "import { OrbitControls, PerspectiveCamera, AmbientLight, DirectionalLight } from '@react-three/drei';",
            "",
            "export default function DigitalTwinScene() {",
            "  return (",
            "    <Canvas>",
        ]
        
        # Helper function to format arrays for JSX
        def format_array(arr):
            return "[" + ", ".join(str(x) for x in arr) + "]"
        
        # Add cameras
        cameras = scene.get("cameras", [])
        if cameras:
            for cam in cameras[:1]:  # Use first camera
                pos = cam.get("position", [0, 0, 10])
                target = cam.get("target", [0, 0, 0])
                fov = cam.get("fov", 75)
                script_lines.append(f"      <PerspectiveCamera makeDefault position={{{format_array(pos)}}} fov={{{fov}}} />")
                script_lines.append(f"      <OrbitControls target={{{format_array(target)}}} />")
        else:
            script_lines.append("      <PerspectiveCamera makeDefault position={[0, 0, 10]} />")
            script_lines.append("      <OrbitControls />")
        
        # Add lights
        lights = scene.get("lights", [])
        if lights:
            for light in lights:
                light_type = light.get("type", "ambient")
                color = light.get("color", "#ffffff")
                intensity = light.get("intensity", 1.0)
                pos = light.get("position", [0, 0, 0])
                
                if light_type == "ambient":
                    script_lines.append(f"      <ambientLight color=\"{color}\" intensity={{{intensity}}} />")
                elif light_type == "directional":
                    script_lines.append(f"      <directionalLight color=\"{color}\" intensity={{{intensity}}} position={{{format_array(pos)}}} />")
                elif light_type == "point":
                    script_lines.append(f"      <pointLight color=\"{color}\" intensity={{{intensity}}} position={{{format_array(pos)}}} />")
        else:
            script_lines.append("      <ambientLight intensity={0.5} />")
            script_lines.append("      <directionalLight position={[10, 10, 5]} intensity={1} />")
        
        # Add objects
        objects = scene.get("objects", [])
        for obj in objects:
            obj_type = obj.get("type", "mesh")
            pos = obj.get("position", [0, 0, 0])
            rot = obj.get("rotation", [0, 0, 0])
            scale = obj.get("scale", [1, 1, 1])
            dims = obj.get("dimensions", {})
            material = obj.get("material", {})
            
            color = material.get("color", "#888888")
            opacity = material.get("opacity", 1.0)
            metalness = material.get("metalness", 0.0)
            roughness = material.get("roughness", 0.5)
            
            length = dims.get("length", 1)
            width = dims.get("width", 1)
            height = dims.get("height", 1)
            
            if obj_type == "solar_panel":
                script_lines.append(f"      <mesh position={{{format_array(pos)}}} rotation={{{format_array(rot)}}} scale={{{format_array(scale)}}}>")
                script_lines.append(f"        <boxGeometry args={{{format_array([length, height, width])}}} />")
                script_lines.append(f"        <meshStandardMaterial color=\"{color}\" opacity={{{opacity}}} metalness={{{metalness}}} roughness={{{roughness}}} />")
                script_lines.append("      </mesh>")
            elif obj_type == "inverter":
                script_lines.append(f"      <mesh position={{{format_array(pos)}}} rotation={{{format_array(rot)}}} scale={{{format_array(scale)}}}>")
                script_lines.append(f"        <boxGeometry args={{{format_array([length, height, width])}}} />")
                script_lines.append(f"        <meshStandardMaterial color=\"{color}\" opacity={{{opacity}}} metalness={{{metalness}}} roughness={{{roughness}}} />")
                script_lines.append("      </mesh>")
            else:
                script_lines.append(f"      <mesh position={{{format_array(pos)}}} rotation={{{format_array(rot)}}} scale={{{format_array(scale)}}}>")
                script_lines.append(f"        <boxGeometry args={{{format_array([length, height, width])}}} />")
                script_lines.append(f"        <meshStandardMaterial color=\"{color}\" opacity={{{opacity}}} metalness={{{metalness}}} roughness={{{roughness}}} />")
                script_lines.append("      </mesh>")
        
        # Add environment
        env = scene.get("environment", {})
        bg = env.get("background")
        if bg and isinstance(bg, str):
            script_lines.append(f"      <color attach=\"background\" args={{{[bg]}}} />")
        
        script_lines.extend([
            "    </Canvas>",
            "  );",
            "}",
        ])
        
        return "\n".join(script_lines)


class AlarmSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlarmState(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    CLOSED = "closed"


class Alarm(Base, TimestampMixin):
    """Operational alarms originating from telemetry or manual triggers."""

    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    device_type = Column(String(64))
    device_id = Column(Integer)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(SQLEnum(AlarmSeverity, native_enum=False, length=32), default=AlarmSeverity.MEDIUM, nullable=False)
    state = Column(SQLEnum(AlarmState, native_enum=False, length=32), default=AlarmState.OPEN, nullable=False)
    triggered_at = Column(DateTime, default=datetime.now, nullable=False)
    acknowledged_at = Column(DateTime)
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    closed_at = Column(DateTime)
    closed_by = Column(Integer, ForeignKey("users.id"))
    metadata = Column("metadata", JSONB, default=dict)

    plant = relationship("Plant", back_populates="alarms")


class DeviceType(str, enum.Enum):
    INVERTER = "inverter"
    WMS = "wms_box"
    STRING_MONITOR = "string_monitoring_box"
    ABT_METER = "abt_meter"


class DeviceSnapshot(Base):
    """Latest telemetry snapshot for any monitored device."""

    __tablename__ = "device_snapshots"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    device_type = Column(SQLEnum(DeviceType, native_enum=False, length=32), nullable=False)
    device_id = Column(Integer, nullable=False)
    recorded_at = Column(DateTime, default=datetime.now, index=True, nullable=False)
    metric_summary = Column(JSONB, nullable=False)
    source = Column(String(64), default="ingest")

    plant = relationship("Plant", back_populates="device_snapshots")


class ReportType(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportJob(Base, TimestampMixin):
    """Report generation requests and lifecycle."""

    __tablename__ = "report_jobs"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    name = Column(String(128), nullable=False)
    description = Column(Text)
    report_type = Column(SQLEnum(ReportType, native_enum=False, length=32), nullable=False)
    schedule = Column(String(128))  # cron-style expression or ISO duration
    status = Column(SQLEnum(ReportStatus, native_enum=False, length=32), default=ReportStatus.PENDING, nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"))
    params = Column(JSONB, default=dict)
    artifact_url = Column(String(512))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    plant = relationship("Plant", back_populates="report_jobs")


class ForecastHorizon(str, enum.Enum):
    DAY_AHEAD = "day_ahead"
    WEEK_AHEAD = "week_ahead"
    MONTH_AHEAD = "month_ahead"


class GenerationForecast(Base, TimestampMixin):
    """Stores predicted generation traces for future windows."""

    __tablename__ = "generation_forecasts"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    forecast_date = Column(Date, nullable=False)
    horizon = Column(SQLEnum(ForecastHorizon, native_enum=False, length=32), nullable=False)
    data_points = Column(JSONB, nullable=False)  # list of [{timestamp, kw}]
    summary = Column(JSONB, default=dict)
    generated_by = Column(Integer, ForeignKey("users.id"))

    plant = relationship("Plant", back_populates="generation_forecasts")


class ShadowRunStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ShadowRun(Base, TimestampMixin):
    """Shadow analysis batch job referencing digital twin geometry."""

    __tablename__ = "shadow_runs"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    twin_id = Column(Integer, ForeignKey("digital_twins.id"))
    requested_by = Column(Integer, ForeignKey("users.id"))
    status = Column(SQLEnum(ShadowRunStatus, native_enum=False, length=32), default=ShadowRunStatus.QUEUED, nullable=False)
    parameters = Column(JSONB, nullable=False)
    result_summary = Column(JSONB)
    asset_url = Column(String(512))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    plant = relationship("Plant", back_populates="shadow_runs")


class UserSetting(Base, TimestampMixin):
    """Per-user UI preferences and notification toggles."""

    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    default_plant_id = Column(Integer, ForeignKey("plants.id"))
    theme = Column(String(32), default="dark")
    notifications = Column(JSONB, default=dict)
    preferences = Column(JSONB, default=dict)


```

```python
from pydantic import BaseModel, EmailStr, Field
from src.models import (
    UserRole,
    AlarmSeverity,
    AlarmState,
    DeviceType,
    ReportType,
    ReportStatus,
    ForecastHorizon,
    ShadowRunStatus,
)
from typing import Optional, Dict, Any, List
from datetime import datetime, date

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.OPERATOR

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None

class DigitalTwinCreate(BaseModel):
    """Schema for creating a new digital twin.
    
    The twin_data field accepts any valid JSON structure. A suggested schema:
    {
        "scene": {
            "objects": [{"type": "solar_panel", "position": [x,y,z], ...}],
            "lights": [{"type": "ambient", "color": "#hex", ...}],
            "cameras": [{"type": "perspective", "position": [x,y,z], ...}]
        }
    }
    """
    plant_id: int
    twin_data: Dict[str, Any]

class DigitalTwinUpdate(BaseModel):
    """Schema for updating a digital twin."""
    twin_data: Optional[Dict[str, Any]] = None

class DigitalTwinResponse(BaseModel):
    """Schema for digital twin API responses."""
    id: int
    plant_id: int
    twin_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ThreeJSScriptResponse(BaseModel):
    """Schema for ThreeJS script metadata endpoint."""
    script: str
    twin_id: int
    plant_id: int


class PlantBase(BaseModel):
    plant_code: int
    timezone: str
    latitude: float
    longitude: float
    total_power_output_kw: float
    name: Optional[str] = None
    db_plant_id: Optional[int] = None
    elevation_m: Optional[float] = None
    no_of_inverters: Optional[int] = None
    no_of_panels: Optional[int] = None
    panel_per_string: Optional[int] = None
    string_per_row: Optional[int] = None
    string_per_inverter: Optional[int] = None
    power_output_per_inverter_kw: Optional[float] = None
    power_output_per_panel_kw: Optional[float] = None
    axis_tilt: Optional[float] = None
    axis_azimuth: Optional[float] = None
    max_angle: Optional[float] = None
    backtrack: Optional[bool] = None
    tracking: Optional[str] = None
    total_area_m2: Optional[float] = None
    gcr: Optional[float] = None


class PlantCreate(PlantBase):
    pass


class PlantUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_power_output_kw: Optional[float] = None
    no_of_inverters: Optional[int] = None
    no_of_panels: Optional[int] = None
    panel_per_string: Optional[int] = None
    string_per_row: Optional[int] = None
    string_per_inverter: Optional[int] = None
    power_output_per_inverter_kw: Optional[float] = None
    power_output_per_panel_kw: Optional[float] = None
    axis_tilt: Optional[float] = None
    axis_azimuth: Optional[float] = None
    max_angle: Optional[float] = None
    backtrack: Optional[bool] = None
    tracking: Optional[str] = None
    total_area_m2: Optional[float] = None
    gcr: Optional[float] = None


class PlantResponse(PlantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlarmCreate(BaseModel):
    plant_id: int
    title: str
    message: str
    severity: AlarmSeverity = AlarmSeverity.MEDIUM
    device_type: Optional[str] = None
    device_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class AlarmUpdate(BaseModel):
    state: Optional[AlarmState] = None
    severity: Optional[AlarmSeverity] = None
    message: Optional[str] = None
    acknowledged: Optional[bool] = Field(default=None, description="Set true to acknowledge current alarm")
    closed: Optional[bool] = Field(default=None, description="Set true to close current alarm")
    metadata: Optional[Dict[str, Any]] = None


class AlarmResponse(BaseModel):
    id: int
    plant_id: int
    title: str
    message: str
    severity: AlarmSeverity
    state: AlarmState
    device_type: Optional[str]
    device_id: Optional[int]
    triggered_at: datetime
    acknowledged_at: Optional[datetime]
    acknowledged_by: Optional[int]
    closed_at: Optional[datetime]
    closed_by: Optional[int]
    metadata: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class DeviceSnapshotCreate(BaseModel):
    plant_id: int
    device_type: DeviceType
    device_id: int
    metric_summary: Dict[str, Any]
    recorded_at: Optional[datetime] = None
    source: Optional[str] = None


class DeviceSnapshotResponse(BaseModel):
    id: int
    plant_id: int
    device_type: DeviceType
    device_id: int
    recorded_at: datetime
    metric_summary: Dict[str, Any]
    source: Optional[str]

    class Config:
        from_attributes = True


class ReportJobCreate(BaseModel):
    plant_id: Optional[int] = None
    name: str
    report_type: ReportType
    schedule: Optional[str] = None
    description: Optional[str] = None
    params: Optional[Dict[str, Any]] = None


class ReportJobResponse(BaseModel):
    id: int
    plant_id: Optional[int]
    name: str
    description: Optional[str]
    report_type: ReportType
    schedule: Optional[str]
    status: ReportStatus
    requested_by: Optional[int]
    params: Optional[Dict[str, Any]]
    artifact_url: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GenerationForecastCreate(BaseModel):
    plant_id: int
    forecast_date: date
    horizon: ForecastHorizon
    data_points: List[Dict[str, Any]]
    summary: Optional[Dict[str, Any]] = None


class GenerationForecastResponse(BaseModel):
    id: int
    plant_id: int
    forecast_date: date
    horizon: ForecastHorizon
    data_points: List[Dict[str, Any]]
    summary: Optional[Dict[str, Any]]
    generated_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShadowRunCreate(BaseModel):
    plant_id: int
    twin_id: Optional[int] = None
    parameters: Dict[str, Any]


class ShadowRunResponse(BaseModel):
    id: int
    plant_id: int
    twin_id: Optional[int]
    requested_by: Optional[int]
    status: ShadowRunStatus
    parameters: Dict[str, Any]
    result_summary: Optional[Dict[str, Any]]
    asset_url: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserSettingUpdate(BaseModel):
    default_plant_id: Optional[int] = None
    theme: Optional[str] = Field(default=None, pattern="^(light|dark)$")
    notifications: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None


class UserSettingResponse(BaseModel):
    id: int
    user_id: int
    default_plant_id: Optional[int]
    theme: Optional[str]
    notifications: Optional[Dict[str, Any]]
    preferences: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

```

```python
from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Tuple, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from src.models import (
    Plant,
    DeviceSnapshot,
    Alarm,
    GenerationForecast,
    ShadowRun,
    ReportJob,
)


def _ensure_plant(db: Session, plant_id: int) -> Plant:
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise ValueError(f"Plant {plant_id} not found")
    return plant


def fetch_dashboard_overview(db: Session, plant_id: int, hours: int) -> Dict[str, Any]:
    plant = _ensure_plant(db, plant_id)
    since = datetime.utcnow() - timedelta(hours=hours)
    snapshots = (
        db.query(DeviceSnapshot)
        .filter(
            DeviceSnapshot.plant_id == plant_id,
            DeviceSnapshot.recorded_at >= since,
        )
        .order_by(DeviceSnapshot.recorded_at.desc())
        .limit(50)
        .all()
    )

    total_power_kw = 0.0
    latest_temp = None
    latest_irradiance = None
    for snap in snapshots:
        metrics = snap.metric_summary or {}
        total_power_kw += float(metrics.get("power_kw", 0))
        if latest_temp is None and "temperature_c" in metrics:
            latest_temp = metrics["temperature_c"]
        if latest_irradiance is None and "irradiance_wm2" in metrics:
            latest_irradiance = metrics["irradiance_wm2"]

    alarm_counts = (
        db.query(Alarm.state, func.count(Alarm.id))
        .filter(Alarm.plant_id == plant_id)
        .group_by(Alarm.state)
        .all()
    )
    alarms_by_state = {state.value if hasattr(state, "value") else state: count for state, count in alarm_counts}

    return {
        "plant": {
            "id": plant.id,
            "name": plant.name,
            "output_kw": plant.total_power_output_kw,
            "latitude": plant.latitude,
            "longitude": plant.longitude,
            "altitude": plant.elevation_m,
        },
        "metrics": {
            "live_irradiance": latest_irradiance,
            "temperature_c": latest_temp,
            "total_power_kw": round(total_power_kw, 2),
            "alarm_counts": alarms_by_state,
        },
    }


def fetch_realtime_power_series(db: Session, plant_id: int, hours: int) -> List[Dict[str, Any]]:
    since = datetime.utcnow() - timedelta(hours=hours)
    snapshots = (
        db.query(DeviceSnapshot)
        .filter(
            DeviceSnapshot.plant_id == plant_id,
            DeviceSnapshot.recorded_at >= since,
        )
        .order_by(DeviceSnapshot.recorded_at.asc())
        .all()
    )
    series = []
    for snap in snapshots:
        metrics = snap.metric_summary or {}
        series.append(
            {
                "timestamp": snap.recorded_at.isoformat(),
                "power_kw": float(metrics.get("power_kw", 0)),
            }
        )
    return series


def fetch_daily_energy(db: Session, plant_id: int, days: int) -> List[Dict[str, Any]]:
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    results: List[Dict[str, Any]] = []
    for idx in range(days):
        day = start_date + timedelta(days=idx)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        snapshots = (
            db.query(DeviceSnapshot.metric_summary)
            .filter(
                DeviceSnapshot.plant_id == plant_id,
                DeviceSnapshot.recorded_at >= day_start,
                DeviceSnapshot.recorded_at < day_end,
            )
            .all()
        )
        energy = 0.0
        for (metric,) in snapshots:
            metric = metric or {}
            energy += float(metric.get("energy_mwh", 0))
        results.append({"date": day.isoformat(), "energy_mwh": round(energy, 3)})
    return results


def list_device_snapshots(
    db: Session,
    plant_id: Optional[int],
    device_type: Optional[str],
    limit: int,
    skip: int,
) -> Tuple[int, List[DeviceSnapshot]]:
    query = db.query(DeviceSnapshot)
    if plant_id:
        query = query.filter(DeviceSnapshot.plant_id == plant_id)
    if device_type:
        query = query.filter(DeviceSnapshot.device_type == device_type)
    total = query.count()
    items = (
        query.order_by(DeviceSnapshot.recorded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return total, items


def get_device_metric_history(
    db: Session,
    device_type: str,
    device_id: int,
    hours: int,
) -> List[Dict[str, Any]]:
    since = datetime.utcnow() - timedelta(hours=hours)
    snapshots = (
        db.query(DeviceSnapshot)
        .filter(
            DeviceSnapshot.device_type == device_type,
            DeviceSnapshot.device_id == device_id,
            DeviceSnapshot.recorded_at >= since,
        )
        .order_by(DeviceSnapshot.recorded_at.asc())
        .all()
    )
    return [
        {
            "timestamp": snap.recorded_at.isoformat(),
            "metrics": snap.metric_summary,
        }
        for snap in snapshots
    ]


def list_forecasts(db: Session, plant_id: Optional[int]) -> List[GenerationForecast]:
    query = db.query(GenerationForecast)
    if plant_id:
        query = query.filter(GenerationForecast.plant_id == plant_id)
    return query.order_by(GenerationForecast.forecast_date.desc()).all()


def list_shadow_runs(db: Session, plant_id: Optional[int]) -> List[ShadowRun]:
    query = db.query(ShadowRun)
    if plant_id:
        query = query.filter(ShadowRun.plant_id == plant_id)
    return query.order_by(ShadowRun.created_at.desc()).all()


def list_report_jobs(db: Session, plant_id: Optional[int]) -> List[ReportJob]:
    query = db.query(ReportJob)
    if plant_id:
        query = query.filter(ReportJob.plant_id == plant_id)
    return query.order_by(ReportJob.created_at.desc()).all()

```

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.endpoints.users import get_current_user
from src.endpoints import services
from src.models import Plant

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
def get_dashboard_overview(
    plant_id: int = Query(..., description="Plant identifier to summarize"),
    hours: int = Query(6, ge=1, le=72, description="Rolling window in hours"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return services.fetch_dashboard_overview(db, plant_id, hours)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/realtime-power")
def get_realtime_power_series(
    plant_id: int,
    hours: int = Query(6, ge=1, le=48),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return {
        "plant_id": plant_id,
        "series": services.fetch_realtime_power_series(db, plant_id, hours),
    }


@router.get("/daily-energy")
def get_daily_energy_trend(
    plant_id: int,
    days: int = Query(6, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return {
        "plant_id": plant_id,
        "days": days,
        "data": services.fetch_daily_energy(db, plant_id, days),
    }

```

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.endpoints.users import get_current_user
from src.endpoints import services
from src.schemas import DeviceSnapshotResponse
from src.models import DeviceSnapshot

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@router.get("/devices")
def list_monitored_devices(
    plant_id: int | None = Query(None),
    device_type: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    total, items = services.list_device_snapshots(db, plant_id, device_type, limit, skip)
    return {
        "total": total,
        "items": [
            DeviceSnapshotResponse.from_orm(item) for item in items
        ],
    }


@router.get("/metrics/{device_type}/{device_id}")
def get_device_metrics(
    device_type: str,
    device_id: int,
    hours: int = Query(6, ge=1, le=72),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    history = services.get_device_metric_history(db, device_type, device_id, hours)
    if not history:
        raise HTTPException(status_code=404, detail="No telemetry found for device")
    return {
        "device_type": device_type,
        "device_id": device_id,
        "history": history,
    }

```

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.endpoints.users import get_current_user
from src.schemas import AlarmCreate, AlarmUpdate, AlarmResponse
from src.models import Alarm, AlarmState, AlarmSeverity, User, UserRole

router = APIRouter(prefix="/alarms", tags=["Alarms"])


@router.get("", response_model=list[AlarmResponse])
def list_alarms(
    plant_id: int | None = Query(None),
    state: AlarmState | None = Query(None),
    severity: AlarmSeverity | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alarm)
    if plant_id:
        query = query.filter(Alarm.plant_id == plant_id)
    if state:
        query = query.filter(Alarm.state == state)
    if severity:
        query = query.filter(Alarm.severity == severity)
    alarms = query.order_by(Alarm.triggered_at.desc()).all()
    return alarms


@router.post("", response_model=AlarmResponse, status_code=status.HTTP_201_CREATED)
def create_alarm(
    payload: AlarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alarm = Alarm(
        plant_id=payload.plant_id,
        title=payload.title,
        message=payload.message,
        severity=payload.severity,
        device_type=payload.device_type,
        device_id=payload.device_id,
        metadata=payload.metadata or {},
    )
    db.add(alarm)
    db.commit()
    db.refresh(alarm)
    return alarm


@router.patch("/{alarm_id}", response_model=AlarmResponse)
def update_alarm(
    alarm_id: int,
    payload: AlarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    if payload.severity:
        alarm.severity = payload.severity
    if payload.message:
        alarm.message = payload.message
    if payload.state:
        alarm.state = payload.state
    if payload.metadata is not None:
        alarm.metadata = payload.metadata

    if payload.acknowledged:
        alarm.state = AlarmState.ACKNOWLEDGED
        alarm.acknowledged_at = alarm.acknowledged_at or alarm.updated_at
        alarm.acknowledged_by = current_user.id

    if payload.closed:
        alarm.state = AlarmState.CLOSED
        alarm.closed_at = alarm.closed_at or alarm.updated_at
        alarm.closed_by = current_user.id

    db.commit()
    db.refresh(alarm)
    return alarm


@router.delete("/{alarm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can delete alarms")
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    db.delete(alarm)
    db.commit()

```

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime

from src.database import get_db
from src.endpoints.users import get_current_user
from src.schemas import ReportJobCreate, ReportJobResponse
from src.models import ReportJob, ReportStatus, User
from src.endpoints import services

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=list[ReportJobResponse])
def list_report_jobs(
    plant_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = services.list_report_jobs(db, plant_id)
    return jobs


@router.post("", response_model=ReportJobResponse, status_code=status.HTTP_201_CREATED)
def create_report_job(
    payload: ReportJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = ReportJob(
        plant_id=payload.plant_id,
        name=payload.name,
        description=payload.description,
        report_type=payload.report_type,
        schedule=payload.schedule,
        params=payload.params or {},
        requested_by=current_user.id,
        status=ReportStatus.PENDING,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/{job_id}", response_model=ReportJobResponse)
def get_report_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(ReportJob).filter(ReportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Report job not found")
    return job


@router.post("/{job_id}/complete", response_model=ReportJobResponse)
def mark_report_complete(
    job_id: int,
    artifact_url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(ReportJob).filter(ReportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Report job not found")
    job.status = ReportStatus.COMPLETED
    job.artifact_url = artifact_url
    job.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job

```

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.endpoints.users import get_current_user
from src.schemas import PlantCreate, PlantUpdate, PlantResponse
from src.models import Plant, User, UserRole

router = APIRouter(prefix="/plants", tags=["Plants"])


@router.get("", response_model=list[PlantResponse])
def list_plants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Plant).order_by(Plant.name.asc()).all()


@router.post("", response_model=PlantResponse, status_code=status.HTTP_201_CREATED)
def create_plant(
    payload: PlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can create plants")

    plant = Plant(**payload.dict())
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@router.put("/{plant_id}", response_model=PlantResponse)
def update_plant(
    plant_id: int,
    payload: PlantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can update plants")
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(plant, field, value)
    db.commit()
    db.refresh(plant)
    return plant


@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can delete plants")
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    db.delete(plant)
    db.commit()

```

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from src.database import get_db
from src.endpoints.users import get_current_user
from src.models import (
    Inverter,
    Wms_box,
    String_monitoring_box,
    Abt_meter,
    User,
    UserRole,
)

router = APIRouter(prefix="/devices", tags=["Devices"])

DEVICE_MODEL_MAP = {
    "inverters": Inverter,
    "wms": Wms_box,
    "string-monitoring": String_monitoring_box,
    "abt-meters": Abt_meter,
}


def _resolve_model(group: str):
    model = DEVICE_MODEL_MAP.get(group)
    if not model:
        raise HTTPException(status_code=404, detail=f"Device group '{group}' not supported")
    return model


@router.get("/{group}")
def list_devices(
    group: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    model = _resolve_model(group)
    return db.query(model).all()


@router.get("/{group}/{device_id}")
def get_device(
    group: str,
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    model = _resolve_model(group)
    device = db.query(model).filter(model.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/{group}", status_code=status.HTTP_201_CREATED)
def create_device(
    group: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can create devices")
    model = _resolve_model(group)
    device = model(**payload)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.put("/{group}/{device_id}")
def update_device(
    group: str,
    device_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can update devices")
    model = _resolve_model(group)
    device = db.query(model).filter(model.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for field, value in payload.items():
        if hasattr(device, field):
            setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{group}/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    group: str,
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can delete devices")
    model = _resolve_model(group)
    device = db.query(model).filter(model.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()

```

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.endpoints.users import get_current_user
from src.schemas import GenerationForecastCreate, GenerationForecastResponse
from src.models import GenerationForecast, User
from src.endpoints import services

router = APIRouter(prefix="/predicted-generation", tags=["PredictedGeneration"])


@router.get("", response_model=list[GenerationForecastResponse])
def list_generation_forecasts(
    plant_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forecasts = services.list_forecasts(db, plant_id)
    return forecasts


@router.post("", response_model=GenerationForecastResponse, status_code=status.HTTP_201_CREATED)
def create_generation_forecast(
    payload: GenerationForecastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forecast = GenerationForecast(
        plant_id=payload.plant_id,
        forecast_date=payload.forecast_date,
        horizon=payload.horizon,
        data_points=payload.data_points,
        summary=payload.summary or {},
        generated_by=current_user.id,
    )
    db.add(forecast)
    db.commit()
    db.refresh(forecast)
    return forecast


@router.get("/{forecast_id}", response_model=GenerationForecastResponse)
def get_generation_forecast(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forecast = db.query(GenerationForecast).filter(GenerationForecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast

```

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime

from src.database import get_db
from src.endpoints.users import get_current_user
from src.schemas import ShadowRunCreate, ShadowRunResponse
from src.models import ShadowRun, ShadowRunStatus, User
from src.endpoints import services

router = APIRouter(prefix="/shadow-analysis", tags=["ShadowAnalysis"])


@router.get("", response_model=list[ShadowRunResponse])
def list_shadow_runs(
    plant_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    runs = services.list_shadow_runs(db, plant_id)
    return runs


@router.post("", response_model=ShadowRunResponse, status_code=status.HTTP_201_CREATED)
def create_shadow_run(
    payload: ShadowRunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = ShadowRun(
        plant_id=payload.plant_id,
        twin_id=payload.twin_id,
        parameters=payload.parameters,
        requested_by=current_user.id,
        status=ShadowRunStatus.QUEUED,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.post("/{run_id}/complete", response_model=ShadowRunResponse)
def mark_shadow_run_complete(
    run_id: int,
    result_summary: dict,
    asset_url: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = db.query(ShadowRun).filter(ShadowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Shadow analysis run not found")
    run.status = ShadowRunStatus.COMPLETED
    run.result_summary = result_summary
    run.asset_url = asset_url
    run.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return run

```

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.endpoints.users import get_current_user
from src.schemas import UserSettingUpdate, UserSettingResponse
from src.models import UserSetting, User, UserRole

router = APIRouter(prefix="/settings", tags=["Settings"])


def _get_or_create_user_setting(db: Session, user_id: int) -> UserSetting:
    setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if setting:
        return setting
    setting = UserSetting(user_id=user_id)
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.get("/me", response_model=UserSettingResponse)
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_or_create_user_setting(db, current_user.id)


@router.put("/me", response_model=UserSettingResponse)
def update_my_settings(
    payload: UserSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    setting = _get_or_create_user_setting(db, current_user.id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(setting, field, value)
    db.commit()
    db.refresh(setting)
    return setting


@router.get("/users/{user_id}", response_model=UserSettingResponse)
def get_user_settings(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PLANT_ADMIN:
        raise HTTPException(status_code=403, detail="Only plant admins can view other settings")
    setting = _get_or_create_user_setting(db, user_id)
    return setting

```

```python
from fastapi import APIRouter
from src.database import Base, engine
from src.auth import routes as auth_routes
from src.endpoints.users import router as user_routes
from src.endpoints.digital_twins import router as digital_twins_routes
from src.endpoints.dashboard import router as dashboard_routes
from src.endpoints.monitoring import router as monitoring_routes
from src.endpoints.alarms import router as alarm_routes
from src.endpoints.reports import router as report_routes
from src.endpoints.plants import router as plant_routes
from src.endpoints.devices import router as device_routes
from src.endpoints.predicted_generation import router as predicted_generation_routes
from src.endpoints.shadow_analysis import router as shadow_analysis_routes
from src.endpoints.settings import router as settings_routes

def init_models():
    Base.metadata.create_all(bind=engine)

router = APIRouter()

# router.include_router(auth_routes.router)
router.include_router(user_routes)
router.include_router(plant_routes)
router.include_router(device_routes)
router.include_router(dashboard_routes)
router.include_router(monitoring_routes)
router.include_router(alarm_routes)
router.include_router(report_routes)
router.include_router(predicted_generation_routes)
router.include_router(shadow_analysis_routes)
router.include_router(settings_routes)
router.include_router(digital_twins_routes)

if __name__ == "__main__":
    init_models()

```

## API Support Updates
- Added the missing operational domain models (alarms, device snapshots, report jobs, forecasts, shadow runs, user settings) plus supporting enums/relationships so Postgres can persist every dashboard feature in one schema.  
```463:617:src/models.py
class AlarmSeverity(str, enum.Enum):
    ...
class UserSetting(Base, TimestampMixin):
    ...
```
- Expanded the Pydantic layer with CRUD contracts for plants, alarms, telemetry snapshots, reports, forecasts, shadow runs, and user settings so every router has typed inputs/outputs ready for FastAPI.  
```88:303:src/schemas.py
class PlantBase(BaseModel):
    ...
class UserSettingResponse(BaseModel):
    ...
```
- Introduced reusable data helpers that aggregate dashboard metrics, device history, forecast/shadow/report listings, and enforce plant existence—keeps the new routers lean while centralizing data math.  
```1:190:src/endpoints/services.py
def fetch_dashboard_overview(...):
    ...
```
- Implemented dedicated routers for Dashboard, Monitoring, Alarms, Reports, Plants, Devices, Predicted Generation, Shadow Analysis, and Settings, each wired to auth/deps and returning the data structures the UI expects.  
```1:49:src/endpoints/dashboard.py
@router.get("/overview")
...
```
- Registered every new router with the shared `endpoints` aggregator so `app.include_router(endpoints_router)` now exposes all UI tabs via FastAPI.  
```1:35:src/endpoints/routes.py
router.include_router(dashboard_routes)
...
```

## Testing
- Not run (not requested).

## Next Steps
- Run DB migrations (Alembic or manual) to create the new tables/enums before hitting the endpoints.
- Populate `device_snapshots` and related tables from your telemetry ingest so the dashboard/monitoring routes return meaningful data.
- Hook report/shadow completion endpoints into your background workers to update job statuses automatically.

```python
class AlarmSeverity(str, enum.Enum):
    ...
class UserSetting(Base, TimestampMixin):
    ...
```

```python
class PlantBase(BaseModel):
    ...
class UserSettingResponse(BaseModel):
    ...
```

```python
def fetch_dashboard_overview(...):
    ...
```

```python
@router.get("/overview")
...
```

```python
router.include_router(dashboard_routes)
...
```

