import { ReplitConnectors } from "@replit/connectors-sdk";
import { createClient } from "@replit/revenuecat-sdk/client";

const REVENUECAT_CONNECTOR_NAME = "revenuecat";
const REVENUECAT_BASE_URL = "https://api.revenuecat.com/v2";

export async function getUncachableRevenueCatClient() {
  const connectors = new ReplitConnectors();

  return createClient({
    baseUrl: REVENUECAT_BASE_URL,
    fetch: connectors.createProxyFetch(REVENUECAT_CONNECTOR_NAME),
  });
}
