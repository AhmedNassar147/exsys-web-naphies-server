/*
 *
 * Helper: `createNphiesRequest`.
 *
 */
import { delayProcess } from "@exsys-web-server/helpers";
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
  requestParams,
  transformApiResults,
  retryTimes = RETRY_TIMES,
  retryDelay = RETRY_DELAY,
  baseAPiUrl: _baseAPiUrl,
  startingDelayTimeout,
}) => {
  const baseAPiUrl =
    _baseAPiUrl || (production ? NPHIES_PRODUCTION : NPHIES_DEVELOPMENT);
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

  if (startingDelayTimeout) {
    delayProcess(startingDelayTimeout);
  }

  return await createFetchRequest({
    baseAPiUrl,
    requestParams,
    requestHeaders,
    httpsAgent,
    transformApiResults,
    body: bodyData,
    retryTimes,
    retryDelay,
    errorMessage: "Nphies server is not connected",
  });
};

export default createNphiesRequest;
