/*
 *
 * Constants: 'exsys-web-naphies-server'.
 *
 */
import readJsonFile from "./nodeHelpers/readJsonFile.mjs";
import collectProcessOptions from "./nodeHelpers/collectProcessOptions.mjs";

// --dev, --certificate-path="" , ---ignore-cert, ---production
export const CLI_CONFIG = await collectProcessOptions();
export const SERVER_CONFIG = await readJsonFile("config.json", true);

export const SERVER_PORT = 5000;
export const RETRY_TIMES = 3;
export const NPHIES_RETRY_TIMES = 2;
export const RETRY_DELAY = 10000;
export const EXSYS_POLLS_TIMEOUT = 4000;
export const RESTART_SERVER_MS = 60000;
const { dev, certificatePath } = CLI_CONFIG;

const BASE_API_IP_ADDRESS = dev ? "http://149.102.140.8" : "http://localhost";
const API_URL_PORT = 9090;

export const EXSYS_BASE_URL = `${BASE_API_IP_ADDRESS}:${API_URL_PORT}/ords/exsys_api`;

export const EXSYS_API_IDS_NAMES = {
  getExsysDataBasedPatient: "getExsysDataBasedPatient",
  saveNphiesResponseToExsys: "saveNphiesResponseToExsys",
  checkExsysPollPendingRequests: "checkExsysPollPendingRequests",
};

export const EXSYS_API_IDS = {
  [EXSYS_API_IDS_NAMES.getExsysDataBasedPatient]:
    "nphies_pkg/create_nphies_request",
  [EXSYS_API_IDS_NAMES.saveNphiesResponseToExsys]:
    "nphies_pkg/update_nphies_request_status",
  [EXSYS_API_IDS_NAMES.checkExsysPollPendingRequests]:
    "nphies_pkg/check_poll_pending_request",
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
  COVERAGE: "Coverage",
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

export const NPHIES_CERT_FILE_NAME = `certs/${
  certificatePath || "Certificate_pkcs12.p12"
}`;

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
