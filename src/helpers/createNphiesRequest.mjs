/*
 *
 * Helper: `createNphiesRequest`.
 *
 */
import { readFile } from "fs/promises";
import https from "https";
import createFetchRequest from "./createFetchRequest.mjs";
import {
  NPHIES_API_URLS,
  RETRY_TIMES,
  RETRY_DELAY,
  CLI_CONFIG,
  NPHIES_CERT_FILE_NAME,
  SERVER_CONFIG,
} from "../constants.mjs";

const { NPHIES_PRODUCTION, NPHIES_DEVELOPMENT } = NPHIES_API_URLS;
const { production, ignoreCert } = CLI_CONFIG;
const { passphrase } = SERVER_CONFIG;

const createNphiesRequest = async ({
  bodyData,
  transformApiResults,
  retryTimes = RETRY_TIMES,
  retryDelay = RETRY_DELAY,
  API_URL,
}) => {
  const apiUrl =
    API_URL || (production ? NPHIES_PRODUCTION : NPHIES_DEVELOPMENT);
  const certificate = ignoreCert
    ? undefined
    : await readFile(NPHIES_CERT_FILE_NAME);

  const requestHeaders = {
    "Content-type": "application/fhir+json",
  };

  const httpsAgent = new https.Agent({
    pfx: certificate,
    passphrase,
  });

  return await createFetchRequest({
    baseAPiUrl: apiUrl,
    requestHeaders,
    httpsAgent,
    transformApiResults,
    body: bodyData,
    retryTimes,
    retryDelay,
    requestMethod: API_URL ? "GET" : "POST",
  });
};

export default createNphiesRequest;

await createNphiesRequest({
  API_URL:
    "https://hsb.nphies.sa/check-insurance?PatientKey=2267803688&SystemType=1",
});
