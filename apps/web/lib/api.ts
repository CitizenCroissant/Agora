import { createApiClient } from "@agora/shared";
import { Config } from "./config";

export const apiClient = createApiClient(Config.API_URL);
