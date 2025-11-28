import api from "./api";
import { UserSetting, UserSettingUpdate } from "../types/api";

export const settingsService = {
  get: async (): Promise<UserSetting> => {
    const response = await api.get("/settings/me");
    return response.data;
  },

  update: async (update: UserSettingUpdate): Promise<UserSetting> => {
    const response = await api.put("/settings/me", update);
    return response.data;
  },
};

