const PRODUCTION_API_ORIGIN = "https://teamx-backend-1-xkxp.onrender.com";
const DEVELOPMENT_API_ORIGIN = "http://localhost:5000";

export function getApiBaseUrl(configuredBaseUrl, isDevelopment) {
  const configured = configuredBaseUrl?.trim();
  const origin = configured || (isDevelopment ? DEVELOPMENT_API_ORIGIN : PRODUCTION_API_ORIGIN);
  const normalized = origin.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}
