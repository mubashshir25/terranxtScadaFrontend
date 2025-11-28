import api from "./api";
import { Alarm, AlarmCreate, AlarmUpdate, AlarmState, AlarmSeverity } from "../types/api";

export const alarmsService = {
  list: async (
    plantId?: number,
    state?: AlarmState,
    severity?: AlarmSeverity
  ): Promise<Alarm[]> => {
    const params: Record<string, any> = {};
    if (plantId !== undefined) params.plant_id = plantId;
    if (state) params.state = state;
    if (severity) params.severity = severity;

    const response = await api.get("/alarms", { params });
    return response.data;
  },

  create: async (alarm: AlarmCreate): Promise<Alarm> => {
    const response = await api.post("/alarms", alarm);
    return response.data;
  },

  update: async (alarmId: number, update: AlarmUpdate): Promise<Alarm> => {
    const response = await api.patch(`/alarms/${alarmId}`, update);
    return response.data;
  },

  delete: async (alarmId: number): Promise<void> => {
    await api.delete(`/alarms/${alarmId}`);
  },
};

