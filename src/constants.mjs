/*
 *
 * Constants: 'exsys-web-naphies-server'.
 *
 */
import readJsonFile from "./helpers/readJsonFile.mjs";

const { appConfig } = await readJsonFile(`${process.cwd()}/package.json`, true);

export const PACKAGE_JSON_APP_CONFIG = appConfig;

export const localStoragePath = `${process.cwd()}/localStorage`;

export const BASE_API_HEADERS = {
  Accept: "*/*",
  "content-type": "application/json",
};

export const WASSEL_API_NAMES = {
  CREATE_TOKEN: "createToken",
  QUEY_CCHI_BENEFICIARY: "queryCchiBeneficiary",
  CREATE_BENEFICIARY: "createBeneficiary",
  CREATE_ELIGIBILITY: "createEligibility",
};

const {
  wassel: { providerId: WASSEL_PROVIDER_ID },
} = PACKAGE_JSON_APP_CONFIG;

export const WASSEL_CONSTANTS = {
  baseAPiUrl: "https://api.stg-eclaims.waseel.com",
  resourceNames: {
    // https://api.stg-eclaims.waseel.com/swagger-ui.html?urls.primaryName=beneficiaries#/
    [WASSEL_API_NAMES.CREATE_TOKEN]: "oauth/authenticate",
    // https://api.eclaims.waseel.com/beneficiaries/providers/754/patientKey/2429674985
    [WASSEL_API_NAMES.QUEY_CCHI_BENEFICIARY]: `beneficiaries/providers/${WASSEL_PROVIDER_ID}/patientKey/:patientKey`,
    [WASSEL_API_NAMES.CREATE_BENEFICIARY]: `beneficiaries/providers/${WASSEL_PROVIDER_ID}`,
    [WASSEL_API_NAMES.CREATE_ELIGIBILITY]: `eligibilities/providers/${WASSEL_PROVIDER_ID}/request`,
  },
  HTTP_STATUS_CODE: {
    200: "success",
    201: "success",
    400: "error, invalid data",
    401: "error, invalid access token",
    403: "error, the request is missing required params or the user does not have access to this service",
    404: "error, the request not found",
  },
};
