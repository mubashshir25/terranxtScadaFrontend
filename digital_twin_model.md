# Design digital twin model and API
_Exported on 11/28/2025 at 12:53:15 GMT+5:30 from Cursor (2.0.77)_

---

**User**

given my @models.py make a digital twin class model also such that 

1. it is stored in a json format in the permanent postgres table 

2. one single plant can have many digital twins 

3. from the digital twin table we are able to derive the metadata which is a ThreeJS script which creates a 3d digital twin for display in the react app

4. give me an example sql insertion script to insert an example of this twin into the database 

5. also create appropriate fastapi endpoints to be able to interact in a meaningful way with this digital twin in the react application, design the backend api stack here to support digital twin fucntionality in the frontend  \

---

**Cursor**


Reviewing the codebase to understand the structure before drafting the plan.



A few clarifications before drafting the plan:



1. What should the JSON structure contain? Should it include:
   - a) A flexible schema (any valid JSON)
   - b) A specific structure (e.g., scene objects, materials, geometries, positions)
   - c) Both (flexible JSONB with a suggested schema)

2. What additional fields should the DigitalTwin model have beyond the JSONB data?
   - a) Minimal (just JSONB + plant_id + timestamps)
   - b) Standard (name, description, version, is_active, plus JSONB)
   - c) Extended (name, description, version, is_active, created_by, tags, plus JSONB)

3. How should the ThreeJS metadata be accessed?
   - a) Computed property on the model that generates the script
   - b) Separate endpoint that returns the ThreeJS script
   - c) Both (property + endpoint)


---

**User**

1 it should contain both flexible JSONB with a suggested schema

2. a) Minimal (just JSONB + plant_id + timestamps)

3. c) Both (property + endpoint)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the plan. Starting with the DigitalTwin model, then schemas, endpoints, and the SQL example.



Implementing step by step, starting with the DigitalTwin model:


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

```

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
        
        # Add cameras
        cameras = scene.get("cameras", [])
        if cameras:
            for cam in cameras[:1]:  # Use first camera
                pos = cam.get("position", [0, 0, 10])
                target = cam.get("target", [0, 0, 0])
                fov = cam.get("fov", 75)
                script_lines.append(f"      <PerspectiveCamera makeDefault position={pos} fov={fov} />")
                script_lines.append(f"      <OrbitControls target={target} />")
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
                    script_lines.append(f"      <ambientLight color=\"{color}\" intensity={intensity} />")
                elif light_type == "directional":
                    script_lines.append(f"      <directionalLight color=\"{color}\" intensity={intensity} position={pos} />")
                elif light_type == "point":
                    script_lines.append(f"      <pointLight color=\"{color}\" intensity={intensity} position={pos} />")
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
                script_lines.append(f"      <mesh position={pos} rotation={rot} scale={scale}>")
                script_lines.append(f"        <boxGeometry args={[length, height, width]} />")
                script_lines.append(f"        <meshStandardMaterial color=\"{color}\" opacity={opacity} metalness={metalness} roughness={roughness} />")
                script_lines.append("      </mesh>")
            elif obj_type == "inverter":
                script_lines.append(f"      <mesh position={pos} rotation={rot} scale={scale}>")
                script_lines.append(f"        <boxGeometry args={[length, height, width]} />")
                script_lines.append(f"        <meshStandardMaterial color=\"{color}\" opacity={opacity} metalness={metalness} roughness={roughness} />")
                script_lines.append("      </mesh>")
            else:
                script_lines.append(f"      <mesh position={pos} rotation={rot} scale={scale}>")
                script_lines.append(f"        <boxGeometry args={[length, height, width]} />")
                script_lines.append(f"        <meshStandardMaterial color=\"{color}\" opacity={opacity} metalness={metalness} roughness={roughness} />")
                script_lines.append("      </mesh>")
        
        # Add environment
        env = scene.get("environment", {})
        bg = env.get("background")
        if bg:
            script_lines.append(f"      <color attach=\"background\" args={[bg]} />")
        
        script_lines.extend([
            "    </Canvas>",
            "  );",
            "}",
        ])
        
        return "\n".join(script_lines)

```


Adding Pydantic schemas:


```python
from pydantic import BaseModel, EmailStr
from src.models import UserRole
from typing import Optional, Dict, Any
from datetime import datetime

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

```

```python
from pydantic import BaseModel, EmailStr
from src.models import UserRole
from typing import Optional, Dict, Any
from datetime import datetime

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

```


Creating the FastAPI endpoints:


```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.auth.jwt_handler import verify_access_token
from src.auth.token_blacklist import token_blacklist
from src.database import get_db
from src.models import DigitalTwin, Plant, User
from src.schemas import DigitalTwinCreate, DigitalTwinUpdate, DigitalTwinResponse, ThreeJSScriptResponse
from src.endpoints.users import get_current_user

router = APIRouter(prefix="/digital-twins", tags=["DigitalTwins"])


@router.post("", response_model=DigitalTwinResponse, status_code=status.HTTP_201_CREATED)
def create_digital_twin(
    twin: DigitalTwinCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new digital twin for a plant."""
    # Verify plant exists
    plant = db.query(Plant).filter(Plant.id == twin.plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plant with id {twin.plant_id} not found"
        )
    
    # Create digital twin
    db_twin = DigitalTwin(
        plant_id=twin.plant_id,
        twin_data=twin.twin_data
    )
    
    db.add(db_twin)
    db.commit()
    db.refresh(db_twin)
    
    return db_twin


@router.get("", response_model=List[DigitalTwinResponse])
def list_digital_twins(
    plant_id: Optional[int] = Query(None, description="Filter by plant ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all digital twins, optionally filtered by plant_id."""
    query = db.query(DigitalTwin)
    
    if plant_id is not None:
        query = query.filter(DigitalTwin.plant_id == plant_id)
    
    twins = query.offset(skip).limit(limit).all()
    return twins


@router.get("/{twin_id}", response_model=DigitalTwinResponse)
def get_digital_twin(
    twin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific digital twin by ID."""
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    return twin


@router.put("/{twin_id}", response_model=DigitalTwinResponse)
def update_digital_twin(
    twin_id: int,
    twin_update: DigitalTwinUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a digital twin's data."""
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    if twin_update.twin_data is not None:
        twin.twin_data = twin_update.twin_data
    
    db.commit()
    db.refresh(twin)
    
    return twin


@router.delete("/{twin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_digital_twin(
    twin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a digital twin."""
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    db.delete(twin)
    db.commit()
    return None


@router.get("/{twin_id}/threejs", response_model=ThreeJSScriptResponse)
def get_threejs_script(
    twin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the ThreeJS/React Three Fiber script for a digital twin.
    
    This endpoint generates a React Three Fiber compatible script from the
    stored twin_data JSON. The script can be used directly in the React frontend
    to render the 3D digital twin scene.
    """
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    script = twin.generate_threejs_script()
    
    return ThreeJSScriptResponse(
        script=script,
        twin_id=twin.id,
        plant_id=twin.plant_id
    )


@router.get("/plants/{plant_id}/digital-twins", response_model=List[DigitalTwinResponse])
def get_plant_digital_twins(
    plant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all digital twins for a specific plant."""
    # Verify plant exists
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plant with id {plant_id} not found"
        )
    
    twins = db.query(DigitalTwin).filter(DigitalTwin.plant_id == plant_id).all()
    return twins

```


Registering the router and updating app.py:


```python
from fastapi import APIRouter
from src.database import Base, engine
from src.auth import routes as auth_routes
from src.endpoints.users import router as user_routes
from src.endpoints.digital_twins import router as digital_twins_routes

def init_models():
    Base.metadata.create_all(bind=engine)

router = APIRouter()

# router.include_router(auth_routes.router)
router.include_router(user_routes)
router.include_router(digital_twins_routes)

if __name__ == "__main__":
    init_models()

```

```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager
from src.websockets.chat_ws import router as chat_ws_router
import asyncio
import json
import logging
from src.endpoints.routes import router as endpoints_router
from src.auth.routes import router as auth_routes_router
from src.database import Base, engine
# Explicitly import all models to ensure they're registered with Base.metadata
from src.models import (
    User,
    Plant,
    PanelSpec,
    Inverter,
    InverterTransientSpec,
    Abt_meter,
    Wms_box,
    String_monitoring_box,
    DigitalTwin,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on application startup"""
    from sqlalchemy.exc import OperationalError
    
    # Wait for database to be ready (with retries)
    max_retries = 5
    retry_delay = 2
    for attempt in range(max_retries):
        try:
            # Test database connection
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection established")
            break
        except OperationalError as e:
            if attempt < max_retries - 1:
                logger.warning(f"Database not ready yet (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
            else:
                logger.error(f"Failed to connect to database after {max_retries} attempts: {e}")
                raise
    
    try:
        # Log all tables that will be created
        table_names = list(Base.metadata.tables.keys())
        logger.info(f"Found {len(table_names)} model(s) registered with Base.metadata")
        logger.info(f"Creating database tables: {', '.join(table_names)}")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        created_tables = inspector.get_table_names()
        logger.info(f"Database tables created successfully. Total tables: {len(created_tables)}")
        logger.info(f"Created tables: {', '.join(created_tables)}")
        
        # Check if all expected tables exist
        expected_tables = {
            'users', 'plants', 'panel_specs', 'inverters', 
            'inverter_transient_specs', 'abt_meters', 
            'wms_boxes', 'string_monitoring_boxes'
        }
        missing_tables = expected_tables - set(created_tables)
        if missing_tables:
            logger.warning(f"Some expected tables are missing: {missing_tables}")
        else:
            logger.info("All expected tables are present in the database")
            
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}", exc_info=True)
        raise
    yield
    # Cleanup code can go here if needed

app = FastAPI(lifespan=lifespan)

# CORS configuration - must be added before routes
# Configure CORS to allow requests from frontend
# Important: When allow_credentials=True, you cannot use ["*"] for allow_origins
# We explicitly list allowed origins
cors_origins = [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3001",
    "http://192.168.0.195:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],  # Allow all headers for development
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

logger.info(f"CORS configured for origins: {cors_origins}")

# Add middleware to log CORS-related requests for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests for CORS debugging"""
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    
    if origin:
        logger.info(f"Incoming request: {method} {path} from origin: {origin}")
    
    response = await call_next(request)
    
    # Log CORS headers in response
    cors_headers = {
        "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
        "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
        "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
    }
    if any(cors_headers.values()):
        logger.info(f"CORS headers in response: {cors_headers}")
    
    return response

@app.get("/")
async def read_root():
    timenow = datetime.now()
    return {"message": "Server OK", "timestamp": timenow}

@app.get("/health")
async def health():
    timenow = datetime.now()
    return {"status": "ok", "timestamp": timenow}

@app.get("/grafana/dashboard/config")
async def get_grafana_dashboard_config():
    """
    Get Grafana dashboard configuration for frontend integration.
    Returns configuration needed to embed Grafana dashboards.
    
    Returns:
        - baseUrl: Grafana base URL
        - dashboardUid: Dashboard UID
        - kiosk: Enable kiosk mode (hide navigation)
        - dashboardName: Dashboard name
        - orgId: Organization ID
        - from: Time range start (relative time)
        - to: Time range end (relative time)
        - timezone: Timezone setting
        - refresh: Refresh interval
        - panelId: Optional panel ID for single panel view
        - vars: Optional dashboard variables
    """
    config = {
        "baseUrl": "http://localhost:3001",
        "dashboardUid": "ad5c9jk",  # Update with your actual dashboard UID
        "kiosk": True,
        "dashboardName": "executive-dashboard-test-plant-001",
        "orgId": 1,
        "from": "now-6h",
        "to": "now",
        "timezone": "browser",
        "refresh": "5s",
        # Optional fields (uncomment and set as needed):
        # "panelId": 123,  # For single panel view
        # "vars": {        # Dashboard variables
        #     "plant": "001",
        #     "region": "us-west"
        # }
    }
    return config

app.include_router(auth_routes_router)
app.include_router(endpoints_router)
app.include_router(chat_ws_router)


```

```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager
from src.websockets.chat_ws import router as chat_ws_router
import asyncio
import json
import logging
from src.endpoints.routes import router as endpoints_router
from src.auth.routes import router as auth_routes_router
from src.database import Base, engine
# Explicitly import all models to ensure they're registered with Base.metadata
from src.models import (
    User,
    Plant,
    PanelSpec,
    Inverter,
    InverterTransientSpec,
    Abt_meter,
    Wms_box,
    String_monitoring_box,
    DigitalTwin,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on application startup"""
    from sqlalchemy.exc import OperationalError
    
    # Wait for database to be ready (with retries)
    max_retries = 5
    retry_delay = 2
    for attempt in range(max_retries):
        try:
            # Test database connection
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection established")
            break
        except OperationalError as e:
            if attempt < max_retries - 1:
                logger.warning(f"Database not ready yet (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
            else:
                logger.error(f"Failed to connect to database after {max_retries} attempts: {e}")
                raise
    
    try:
        # Log all tables that will be created
        table_names = list(Base.metadata.tables.keys())
        logger.info(f"Found {len(table_names)} model(s) registered with Base.metadata")
        logger.info(f"Creating database tables: {', '.join(table_names)}")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        created_tables = inspector.get_table_names()
        logger.info(f"Database tables created successfully. Total tables: {len(created_tables)}")
        logger.info(f"Created tables: {', '.join(created_tables)}")
        
        # Check if all expected tables exist
        expected_tables = {
            'users', 'plants', 'panel_specs', 'inverters', 
            'inverter_transient_specs', 'abt_meters', 
            'wms_boxes', 'string_monitoring_boxes', 'digital_twins'
        }
        missing_tables = expected_tables - set(created_tables)
        if missing_tables:
            logger.warning(f"Some expected tables are missing: {missing_tables}")
        else:
            logger.info("All expected tables are present in the database")
            
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}", exc_info=True)
        raise
    yield
    # Cleanup code can go here if needed

app = FastAPI(lifespan=lifespan)

# CORS configuration - must be added before routes
# Configure CORS to allow requests from frontend
# Important: When allow_credentials=True, you cannot use ["*"] for allow_origins
# We explicitly list allowed origins
cors_origins = [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3001",
    "http://192.168.0.195:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],  # Allow all headers for development
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

logger.info(f"CORS configured for origins: {cors_origins}")

# Add middleware to log CORS-related requests for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests for CORS debugging"""
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    
    if origin:
        logger.info(f"Incoming request: {method} {path} from origin: {origin}")
    
    response = await call_next(request)
    
    # Log CORS headers in response
    cors_headers = {
        "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
        "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
        "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
    }
    if any(cors_headers.values()):
        logger.info(f"CORS headers in response: {cors_headers}")
    
    return response

@app.get("/")
async def read_root():
    timenow = datetime.now()
    return {"message": "Server OK", "timestamp": timenow}

@app.get("/health")
async def health():
    timenow = datetime.now()
    return {"status": "ok", "timestamp": timenow}

@app.get("/grafana/dashboard/config")
async def get_grafana_dashboard_config():
    """
    Get Grafana dashboard configuration for frontend integration.
    Returns configuration needed to embed Grafana dashboards.
    
    Returns:
        - baseUrl: Grafana base URL
        - dashboardUid: Dashboard UID
        - kiosk: Enable kiosk mode (hide navigation)
        - dashboardName: Dashboard name
        - orgId: Organization ID
        - from: Time range start (relative time)
        - to: Time range end (relative time)
        - timezone: Timezone setting
        - refresh: Refresh interval
        - panelId: Optional panel ID for single panel view
        - vars: Optional dashboard variables
    """
    config = {
        "baseUrl": "http://localhost:3001",
        "dashboardUid": "ad5c9jk",  # Update with your actual dashboard UID
        "kiosk": True,
        "dashboardName": "executive-dashboard-test-plant-001",
        "orgId": 1,
        "from": "now-6h",
        "to": "now",
        "timezone": "browser",
        "refresh": "5s",
        # Optional fields (uncomment and set as needed):
        # "panelId": 123,  # For single panel view
        # "vars": {        # Dashboard variables
        #     "plant": "001",
        #     "region": "us-west"
        # }
    }
    return config

app.include_router(auth_routes_router)
app.include_router(endpoints_router)
app.include_router(chat_ws_router)


```


Creating the SQL insertion example:


```plaintext
-- Example SQL insertion script for Digital Twin
-- This demonstrates how to insert a digital twin with sample JSONB data
-- that follows the suggested schema structure

-- First, ensure you have a plant in the database (replace 1 with an actual plant_id)
-- You can check existing plants with: SELECT id, plant_code, name FROM plants;

-- Example INSERT statement with sample JSONB data
INSERT INTO digital_twins (plant_id, twin_data, created_at, updated_at)
VALUES (
    1,  -- Replace with actual plant_id
    '{
        "scene": {
            "objects": [
                {
                    "type": "solar_panel",
                    "position": [0, 0, 0],
                    "rotation": [0, 0, 0],
                    "scale": [1, 1, 1],
                    "dimensions": {
                        "length": 2.0,
                        "width": 1.0,
                        "height": 0.05
                    },
                    "material": {
                        "color": "#1a5490",
                        "opacity": 1.0,
                        "metalness": 0.1,
                        "roughness": 0.3
                    },
                    "metadata": {
                        "panel_id": "panel_001",
                        "string_number": 1,
                        "row_number": 1
                    }
                },
                {
                    "type": "solar_panel",
                    "position": [2.1, 0, 0],
                    "rotation": [0, 0, 0],
                    "scale": [1, 1, 1],
                    "dimensions": {
                        "length": 2.0,
                        "width": 1.0,
                        "height": 0.05
                    },
                    "material": {
                        "color": "#1a5490",
                        "opacity": 1.0,
                        "metalness": 0.1,
                        "roughness": 0.3
                    },
                    "metadata": {
                        "panel_id": "panel_002",
                        "string_number": 1,
                        "row_number": 1
                    }
                },
                {
                    "type": "inverter",
                    "position": [10, 0, 5],
                    "rotation": [0, 0, 0],
                    "scale": [1, 1, 1],
                    "dimensions": {
                        "length": 1.0,
                        "width": 0.6,
                        "height": 0.8
                    },
                    "material": {
                        "color": "#333333",
                        "opacity": 1.0,
                        "metalness": 0.8,
                        "roughness": 0.2
                    },
                    "metadata": {
                        "inverter_id": "inv_001",
                        "serial_number": "INV-2024-001"
                    }
                },
                {
                    "type": "ground",
                    "position": [0, -0.1, 0],
                    "rotation": [0, 0, 0],
                    "scale": [50, 1, 50],
                    "dimensions": {
                        "length": 50,
                        "width": 50,
                        "height": 0.2
                    },
                    "material": {
                        "color": "#8b7355",
                        "opacity": 1.0,
                        "metalness": 0.0,
                        "roughness": 0.9
                    },
                    "metadata": {}
                }
            ],
            "lights": [
                {
                    "type": "ambient",
                    "color": "#ffffff",
                    "intensity": 0.5
                },
                {
                    "type": "directional",
                    "position": [10, 10, 5],
                    "color": "#ffffff",
                    "intensity": 1.0
                },
                {
                    "type": "directional",
                    "position": [-5, 5, 5],
                    "color": "#ffffff",
                    "intensity": 0.3
                }
            ],
            "cameras": [
                {
                    "type": "perspective",
                    "position": [15, 10, 15],
                    "target": [5, 0, 5],
                    "fov": 75
                }
            ],
            "environment": {
                "background": "#87ceeb",
                "fog": {
                    "color": "#87ceeb",
                    "near": 1,
                    "far": 100
                }
            }
        }
    }'::jsonb,
    NOW(),
    NOW()
);

-- Example query to retrieve a digital twin with its plant information
SELECT 
    dt.id,
    dt.plant_id,
    p.name as plant_name,
    dt.twin_data,
    dt.created_at,
    dt.updated_at
FROM digital_twins dt
JOIN plants p ON dt.plant_id = p.id
WHERE dt.plant_id = 1;  -- Replace with actual plant_id

-- Example query to count digital twins per plant
SELECT 
    p.id as plant_id,
    p.name as plant_name,
    COUNT(dt.id) as twin_count
FROM plants p
LEFT JOIN digital_twins dt ON p.id = dt.plant_id
GROUP BY p.id, p.name
ORDER BY p.id;

-- Example query to get all objects from a digital twin's scene
SELECT 
    dt.id as twin_id,
    dt.plant_id,
    jsonb_array_elements(dt.twin_data->'scene'->'objects') as scene_object
FROM digital_twins dt
WHERE dt.id = 1;  -- Replace with actual twin_id

```


Checking for linting errors:



Verifying the import in `digital_twins.py`:



Removing unused imports in `digital_twins.py`:


```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.models import DigitalTwin, Plant, User
from src.schemas import DigitalTwinCreate, DigitalTwinUpdate, DigitalTwinResponse, ThreeJSScriptResponse
from src.endpoints.users import get_current_user

router = APIRouter(prefix="/digital-twins", tags=["DigitalTwins"])


@router.post("", response_model=DigitalTwinResponse, status_code=status.HTTP_201_CREATED)
def create_digital_twin(
    twin: DigitalTwinCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new digital twin for a plant."""
    # Verify plant exists
    plant = db.query(Plant).filter(Plant.id == twin.plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plant with id {twin.plant_id} not found"
        )
    
    # Create digital twin
    db_twin = DigitalTwin(
        plant_id=twin.plant_id,
        twin_data=twin.twin_data
    )
    
    db.add(db_twin)
    db.commit()
    db.refresh(db_twin)
    
    return db_twin


@router.get("", response_model=List[DigitalTwinResponse])
def list_digital_twins(
    plant_id: Optional[int] = Query(None, description="Filter by plant ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all digital twins, optionally filtered by plant_id."""
    query = db.query(DigitalTwin)
    
    if plant_id is not None:
        query = query.filter(DigitalTwin.plant_id == plant_id)
    
    twins = query.offset(skip).limit(limit).all()
    return twins


@router.get("/{twin_id}", response_model=DigitalTwinResponse)
def get_digital_twin(
    twin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific digital twin by ID."""
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    return twin


@router.put("/{twin_id}", response_model=DigitalTwinResponse)
def update_digital_twin(
    twin_id: int,
    twin_update: DigitalTwinUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a digital twin's data."""
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    if twin_update.twin_data is not None:
        twin.twin_data = twin_update.twin_data
    
    db.commit()
    db.refresh(twin)
    
    return twin


@router.delete("/{twin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_digital_twin(
    twin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a digital twin."""
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    db.delete(twin)
    db.commit()
    return None


@router.get("/{twin_id}/threejs", response_model=ThreeJSScriptResponse)
def get_threejs_script(
    twin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the ThreeJS/React Three Fiber script for a digital twin.
    
    This endpoint generates a React Three Fiber compatible script from the
    stored twin_data JSON. The script can be used directly in the React frontend
    to render the 3D digital twin scene.
    """
    twin = db.query(DigitalTwin).filter(DigitalTwin.id == twin_id).first()
    if not twin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digital twin with id {twin_id} not found"
        )
    
    script = twin.generate_threejs_script()
    
    return ThreeJSScriptResponse(
        script=script,
        twin_id=twin.id,
        plant_id=twin.plant_id
    )


@router.get("/plants/{plant_id}/digital-twins", response_model=List[DigitalTwinResponse])
def get_plant_digital_twins(
    plant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all digital twins for a specific plant."""
    # Verify plant exists
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plant with id {plant_id} not found"
        )
    
    twins = db.query(DigitalTwin).filter(DigitalTwin.plant_id == plant_id).all()
    return twins


```


Improving the ThreeJS script generation method to handle edge cases:



Verifying everything is in place:



Fixing JSX array formatting in the ThreeJS script generation:



Fixing JSX array formatting in the ThreeJS script generator:


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
        if bg:
            script_lines.append(f"      <color attach=\"background\" args={[bg]} />")
        
        script_lines.extend([
            "    </Canvas>",
            "  );",
            "}",
        ])
        
        return "\n".join(script_lines)

```

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
        if bg:
            script_lines.append(f"      <color attach=\"background\" args={{{[bg] if isinstance(bg, str) else bg}}} />")
        
        script_lines.extend([
            "    </Canvas>",
            "  );",
            "}",
        ])
        
        return "\n".join(script_lines)

```


Fixing background color formatting:


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

```


## Summary

1. **DigitalTwin model** (`src/models.py`):
   - Added `DigitalTwin` with `plant_id` (FK) and `twin_data` (JSONB)
   - Added `generate_threejs_script()` to convert JSONB to React Three Fiber code
   - Updated `Plant` with `digital_twins` relationship

2. **Pydantic schemas** (`src/schemas.py`):
   - `DigitalTwinCreate`, `DigitalTwinUpdate`, `DigitalTwinResponse`, `ThreeJSScriptResponse`
   - Documented suggested JSON schema in docstrings

3. **FastAPI endpoints** (`src/endpoints/digital_twins.py`):
   - `POST /digital-twins` - Create twin
   - `GET /digital-twins` - List twins (with plant_id filter and pagination)
   - `GET /digital-twins/{twin_id}` - Get specific twin
   - `PUT /digital-twins/{twin_id}` - Update twin
   - `DELETE /digital-twins/{twin_id}` - Delete twin
   - `GET /digital-twins/{twin_id}/threejs` - Get ThreeJS script
   - `GET /plants/{plant_id}/digital-twins` - Get all twins for a plant

4. **Router registration**:
   - Registered in `src/endpoints/routes.py`
   - Added `DigitalTwin` import in `src/app.py`
   - Added `digital_twins` to expected tables list

5. **SQL example** (`src/insert_digital_twin_sql.txt`):
   - Example INSERT with sample JSONB data
   - Example queries for retrieving and analyzing twins

All files pass linting. The implementation follows existing patterns and is ready for use.

