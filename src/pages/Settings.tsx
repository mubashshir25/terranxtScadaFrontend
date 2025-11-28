import React, { useState, useEffect, useContext } from "react";
import { settingsService } from "../services/settings";
import { plantsService } from "../services/plants";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import { UserSetting, UserSettingUpdate, Plant } from "../types/api";
import { AuthContext } from "../context/AuthContext";
import "./Settings.css";

const Settings: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState<UserSetting | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<UserSettingUpdate>({
    theme: undefined,
    default_plant_id: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsData, plantsData] = await Promise.all([
        settingsService.get(),
        plantsService.list(),
      ]);
      setSettings(settingsData);
      setPlants(plantsData);
      setFormData({
        theme: settingsData.theme,
        default_plant_id: settingsData.default_plant_id,
        notifications: settingsData.notifications,
        preferences: settingsData.preferences,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await settingsService.update(formData);
      setSettings(updated);
      setSuccess(true);

      // Update theme in Layout if changed
      if (formData.theme) {
        document.documentElement.setAttribute("data-theme", formData.theme);
        localStorage.setItem("theme", formData.theme);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <LoadingSpinner message="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {success && (
        <ErrorAlert
          message="Settings saved successfully!"
          type="info"
          onDismiss={() => setSuccess(false)}
        />
      )}

      <form onSubmit={handleSave} className="settings-form glass">
        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="form-group">
            <label>Theme</label>
            <select
              className="select"
              value={formData.theme || "dark"}
              onChange={(e) =>
                setFormData({ ...formData, theme: e.target.value as "light" | "dark" })
              }
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>Preferences</h2>
          <div className="form-group">
            <label>Default Plant</label>
            <select
              className="select"
              value={formData.default_plant_id || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  default_plant_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">None</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name || `Plant ${plant.plant_code}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="btn-spinner" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
