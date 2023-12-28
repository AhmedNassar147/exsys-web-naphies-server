/*
 *
 * Helper: `createNphiesRequest`.
 *
 */
import { readFile } from "fs/promises";
import https from "https";
import {
  findRootYarnWorkSpaces,
  readJsonFile,
} from "@exsys-web-server/helpers";
import createFetchRequest from "./createFetchRequest.mjs";
import { getCertificateData } from "../helpers/getConfigFileData.mjs";
import {
  NPHIES_API_URLS,
  RETRY_TIMES,
  RETRY_DELAY,
  CLI_CONFIG,
} from "../constants.mjs";

const { NPHIES_PRODUCTION, NPHIES_DEVELOPMENT } = NPHIES_API_URLS;
const { production } = CLI_CONFIG;

const createNphiesRequest = async ({
  bodyData,
  requestParams,
  requestMethod,
  transformApiResults,
  retryTimes = RETRY_TIMES,
  retryDelay = RETRY_DELAY,
  baseAPiUrl: _baseAPiUrl,
  organizationNo,
}) => {
  const baseAPiUrl =
    _baseAPiUrl || (production ? NPHIES_PRODUCTION : NPHIES_DEVELOPMENT);

  const { passphrase, certificate } = await getCertificateData(organizationNo);

  const requestHeaders = {
    "Content-type": "application/fhir+json",
  };

  const httpsAgent = new https.Agent({
    pfx: certificate,
    passphrase,
  });

  return await createFetchRequest({
    baseAPiUrl,
    requestParams,
    requestHeaders,
    httpsAgent,
    transformApiResults,
    body: bodyData,
    retryTimes,
    retryDelay,
    requestMethod,
    errorMessage: "Nphies server is not connected",
  });
};

export default createNphiesRequest;
