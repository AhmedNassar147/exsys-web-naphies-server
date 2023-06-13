/*
 *
 * Constants: 'exsys-web-naphies-server'.
 *
 */
import readJsonFile from "./nodeHelpers/readJsonFile.mjs";

const { appConfig } = await readJsonFile(`${process.cwd()}/package.json`, true);

export const PACKAGE_JSON_APP_CONFIG = appConfig;

export const localStoragePath = `${process.cwd()}/localStorage`;

export const EXSYS_BASE_URL = "http://149.102.140.8:9090/ords/exsys_api";
export const EXSYS_API_IDS_NAMES = {
  createNphiesRequest: "createNphiesRequest",
};
export const EXSYS_API_IDS = {
  [EXSYS_API_IDS_NAMES.createNphiesRequest]: "nphies_pkg/create_nphies_request",
};

export const HTTP_STATUS_CODE = {
  200: "success",
  201: "success",
  400: "error, invalid data",
  401: "error, invalid access token",
  403: "error, the request is missing required params or the user does not have access to this service",
  404: "error, the request not found",
};

export const BASE_API_HEADERS = {
  Accept: "*/*",
  "content-type": "application/json",
};

export const ELIGIBILITY_TYPES = {
  validation: "validation",
  discovery: "discovery",
  benefits: "benefits",
};

export const NPHIES_RESOURCE_TYPES = {
  BUNDLE: "Bundle",
  RESOURCE_MESSAGE_HEADER: "MessageHeader",
  COVERAGE_ELIGIBILITY_REQUEST: "CoverageEligibilityRequest",
  ORGANIZATION: "Organization",
  PATIENT: "Patient",
  LOCATION: "Location",
  RESOURCE_COVERAGE: "Coverage",
};

export const NPHIES_API_URLS = {
  NPHIES_PRODUCTION: "https://HSB.nphies.sa/$process-message",
  NPHIES_DEVELOPMENT: "http://176.105.150.83:80/$process-message",
  BASE_PROFILE_URL: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition",
  BASE_CODE_SYS_URL: "http://nphies.sa/terminology/CodeSystem",
  BASE_TERMINOLOGY_CODE_SYS_URL: "http://terminology.hl7.org/CodeSystem",
  PROVIDER_LICENSE_URL: "http://nphies.sa/license/provider-license",
  PAYER_LICENSE_URL: "http://nphies.sa/license/payer-license",
  LOCATION_LICENSE_URL: "http://nphies.sa/license/location-license",
};

export const NPHIES_CERT_FILE_NAME = "certs/Certificate_pkcs12.p12";

export const NPHIES_BUNDLE_TYPES = {
  MESSAGE: "message",
};

export const NPHIES_BASE_PROFILE_TYPES = {
  PROFILE_BUNDLE: "bundle|1.0.0",
  MESSAGE_HEADER: "message-header|1.0.0",
  ELIGIBILITY_REQUEST: "eligibility-request|1.0.0",
  PROVIDER_ORGANIZATION: "provider-organization|1.0.0",
  PROFILE_PATIENT: "patient|1.0.0",
  EXT_KSA_ADMIN_GENDER: "extension-ksa-administrative-gender",
  INSURER_ORGANIZATION: "insurer-organization|1.0.0",
  PROFILE_COVERAGE: "coverage|1.0.0",
  PROFILE_LOCATION: "location|1.0.0",
};

export const NPHIES_BASE_CODE_TYPES = {
  KSA_MSG_EVENTS: "ksa-message-events",
  ORGANIZATION_TYPE: "organization-type",
  KSA_ADMIN_GENDER: "ksa-administrative-gender",
  PATIENT_IDENTIFIER_TYPE: "patient-identifier-type",
  MARITAL_STATUS: "v3-MaritalStatus",
  KAS_EXT_ADMIN_GENDER: "extension-ksa-administrative-gender",
  COVERAGE_TYPE: "coverage-type",
  COVERAGE_CLASS: "coverage-class",
  SUBSCRIBER_RELATIONSHIP: "subscriber-relationship",
  PROCESS_PRIORITY: "processpriority",
  ROLE_CODE: "v3-RoleCode",
};
