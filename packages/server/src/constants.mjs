/*
 *
 * Constants: 'exsys-web-naphies-server'.
 *
 */
import {
  readJsonFile,
  collectProcessOptions,
  findRootYarnWorkSpaces,
} from "@exsys-web-server/helpers";

const rootYarnWorkSpacePath = await findRootYarnWorkSpaces();

const configFilePath = `${rootYarnWorkSpacePath}/config.json`;

// --dev, --certificate-path="" , ---ignore-cert, ---production
export const CLI_CONFIG = await collectProcessOptions();
export const SERVER_CONFIG = await readJsonFile(configFilePath, true);

export const FILES_ENCODING_LIMIT = "60mb";

export const SERVER_PORT = 5000;
export const RETRY_TIMES = 3;
export const NPHIES_RETRY_TIMES = 2;
export const RETRY_DELAY = 10000;
export const EXSYS_POLLS_TIMEOUT = 10000;
const { dev, certificatePath } = CLI_CONFIG;
const { dataBaseServerPort } = SERVER_CONFIG;

const BASE_API_IP_ADDRESS = dev ? "http://149.102.140.8" : "http://localhost";
const API_URL_PORT = dataBaseServerPort || 9090;

export const EXSYS_BASE_URL = `${BASE_API_IP_ADDRESS}:${API_URL_PORT}/ords/exsys_api`;

export const EXSYS_API_IDS_NAMES = {
  queryExsysEligibilityData: "queryExsysEligibilityData", // this is a post method
  queryEligibilityPendingRequests: "queryEligibilityPendingRequests",
  saveNphiesResponseToExsys: "saveNphiesResponseToExsys",
  collectExsysPreauthData: "collectExsysPreauthData",
  savePreauthData: "savePreauthData",
  collectExsysClaimData: "collectExsysClaimData",
  saveClaimData: "saveClaimData",
  savePreauthPollData: "savePreauthPollData",
  saveClaimPollData: "saveClaimPollData",
  queryClaimRequestDataToCancellation: "queryClaimRequestDataToCancellation",
  queryBulkClaimsDataToCancellationOrCreation:
    "queryBulkClaimsDataToCancellationOrCreation",
  querySavedClaimsAndPreauthData: "querySavedClaimsAndPreauthData",
};

export const EXSYS_API_IDS = {
  [EXSYS_API_IDS_NAMES.queryExsysEligibilityData]:
    "nphies_pkg/create_nphies_request",
  [EXSYS_API_IDS_NAMES.queryEligibilityPendingRequests]:
    "nphies_pkg/check_poll_pending_request",
  [EXSYS_API_IDS_NAMES.saveNphiesResponseToExsys]:
    "nphies_pkg/update_nphies_request_status",
  // http://149.102.140.8:9090/ords/exsysexsysdba/hs_nphies_preauth_pkg/collect_preauth_data_to_send?authorization=11796985&preauth_pk=1
  [EXSYS_API_IDS_NAMES.collectExsysPreauthData]:
    "hs_nphies_preauth_pkg/collect_preauth_data_to_send",
  // http://149.102.140.8:9090/ords/exsys_api/hs_nphies_preauth_pkg/update_preauth_send_status?preauth_pk=&claim_response_id=&claim_request_id&outcome=&adjudication_outcome
  [EXSYS_API_IDS_NAMES.savePreauthData]:
    "hs_nphies_preauth_pkg/update_preauth_send_status",
  // http://149.102.140.8:9090/ords/exsys_api/hs_nphies_preauth_pkg/update_preauth_pool_status?authorization=11796985&&claimrequestid=&claimresponseid&claimoutcome=&claimpreauthref&claimperiodstart&claimperiodend&claimextensioncode&claimmessageeventtype
  [EXSYS_API_IDS_NAMES.savePreauthPollData]:
    "hs_nphies_preauth_pkg/update_preauth_pool_status",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/collect_claim_episode_to_send?authorization=11796985&organization_no=001&patient_file_no=073393&episode_no=12&episode_invoice_no=I22/38154&message_event_type=pharmacy
  [EXSYS_API_IDS_NAMES.collectExsysClaimData]:
    "nphies_pkg/collect_claim_episode_to_send",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/update_claim_send_status?claim_pk=&claim_response_id=&claim_request_id&outcome=&adjudication_outcome
  [EXSYS_API_IDS_NAMES.saveClaimData]: "nphies_pkg/update_claim_send_status",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/update_claim_pool_status?authorization=11796985&&claimrequestid=&claimresponseid&claimoutcome=&claimpreauthref&claimperiodstart&claimperiodend&claimextensioncode&claimmessageeventtype
  [EXSYS_API_IDS_NAMES.saveClaimPollData]:
    "nphies_pkg/update_claim_pool_status",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/collect_claim_to_cancel?authorization=12985704&patient_file_no=187285&invoice_no=I00122/23664&organization_no=001&claim_pk=604
  [EXSYS_API_IDS_NAMES.queryClaimRequestDataToCancellation]:
    "nphies_pkg/collect_claim_to_cancel",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/get_bulk_claim?authorization=4492758&&organization_no=001&soa_no=S00122/00690&request_type=send
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/get_bulk_claim?authorization=4492758&&organization_no=001&soa_no=S00122/01021&request_type=cancel
  [EXSYS_API_IDS_NAMES.queryBulkClaimsDataToCancellationOrCreation]:
    "nphies_pkg/get_bulk_claim",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/display_nphies_response?authorization=11796985&primary_key=6&request_type=priorauth
  [EXSYS_API_IDS_NAMES.querySavedClaimsAndPreauthData]:
    "nphies_pkg/display_nphies_response",
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

export const NPHIES_REQUEST_TYPES = {
  ELIGIBILITY: "eligibility",
  PREAUTH: "priorauth",
  CLAIM: "claim",
  POLL: "poll",
  CANCEL: "cancel",
};

export const NPHIES_RESOURCE_TYPES = {
  BUNDLE: "Bundle",
  RESOURCE_MESSAGE_HEADER: "MessageHeader",
  COVERAGE_ELIGIBILITY_REQUEST: "CoverageEligibilityRequest",
  ORGANIZATION: "Organization",
  PATIENT: "Patient",
  PRACTITIONER: "Practitioner",
  LOCATION: "Location",
  COVERAGE: "Coverage",
  CLAIM: "Claim",
  VISION_PRESCRIPTION: "Visionprescription",
  TASK: "Task",
};

export const NPHIES_RESOURCE_MAP_TO_REQUEST_TYPE = {
  [NPHIES_REQUEST_TYPES.ELIGIBILITY]:
    NPHIES_RESOURCE_TYPES.COVERAGE_ELIGIBILITY_REQUEST,
  [NPHIES_REQUEST_TYPES.PREAUTH]: NPHIES_RESOURCE_TYPES.CLAIM,
  [NPHIES_REQUEST_TYPES.CLAIM]: NPHIES_RESOURCE_TYPES.CLAIM,
  [NPHIES_REQUEST_TYPES.POLL]: NPHIES_RESOURCE_TYPES.TASK,
  [NPHIES_REQUEST_TYPES.CANCEL]: NPHIES_RESOURCE_TYPES.TASK,
};

export const BASE_NPHIES_URL = "http://nphies.sa";
export const BASE_NPHIES_LICENSE_URL = `${BASE_NPHIES_URL}/license`;

export const NPHIES_API_URLS = {
  NPHIES_PRODUCTION: "https://HSB.nphies.sa/$process-message",
  NPHIES_DEVELOPMENT: "http://176.105.150.83:80/$process-message",
  BASE_TERMINOLOGY_CODE_SYS_URL: "http://terminology.hl7.org/CodeSystem",
  DIAG_ICD_URL: "http://hl7.org/fhir/sid/icd-10-am",
  BASE_PROFILE_URL: `${BASE_NPHIES_URL}/fhir/ksa/nphies-fs/StructureDefinition`,
  BASE_CODE_SYS_URL: `${BASE_NPHIES_URL}/terminology/CodeSystem`,
  IQAMA_URL: `${BASE_NPHIES_URL}/identifier/iqama`,
  PROVIDER_LICENSE_URL: `${BASE_NPHIES_LICENSE_URL}/provider-license`,
  PAYER_LICENSE_URL: `${BASE_NPHIES_LICENSE_URL}/payer-license`,
  LOCATION_LICENSE_URL: `${BASE_NPHIES_LICENSE_URL}/location-license`,
  PRACTITIONER_URL: `${BASE_NPHIES_LICENSE_URL}/practitioner-license`,
  NPHIES_LICENSE_OWNER_URL: `${BASE_NPHIES_LICENSE_URL}/nphies`,
};

export const NPHIES_CERT_FILE_NAME = `${rootYarnWorkSpacePath}/certs/${
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
  PROFILE_PRACTITIONER: "practitioner|1.0.0",
  EXT_KSA_ADMIN_GENDER: "extension-ksa-administrative-gender",
  INSURER_ORGANIZATION: "insurer-organization|1.0.0",
  PROFILE_COVERAGE: "coverage|1.0.0",
  PROFILE_LOCATION: "location|1.0.0",
  PROFILE_VISION_PRESCRIPTION: "vision-prescription|1.0.0",
  PROFILE_VISION_PREAUTH: "vision-priorauth|1.0.0",
  PROFILE_INSTITUTIONAL_PREAUTH: "institutional-priorauth|1.0.0",
  PROFILE_ORAL_PREAUTH: "oral-priorauth|1.0.0",
  PROFILE_PHARMACY_PREAUTH: "pharmacy-priorauth|1.0.0",
  PROFILE_PROFESSIONAL_PREAUTH: "professional-priorauth|1.0.0",
  PROFILE_TASK: "task|1.0.0",
};

export const NPHIES_BASE_CODE_TYPES = {
  KSA_MSG_EVENTS: "ksa-message-events",
  ORGANIZATION_TYPE: "organization-type",
  KSA_ADMIN_GENDER: "ksa-administrative-gender",
  // PATIENT_IDENTIFIER_TYPE: "patient-identifier-type",
  MARITAL_STATUS: "v3-MaritalStatus",
  KAS_EXT_ADMIN_GENDER: "extension-ksa-administrative-gender",
  COVERAGE_TYPE: "coverage-type",
  COVERAGE_CLASS: "coverage-class",
  SUBSCRIBER_RELATIONSHIP: "subscriber-relationship",
  PROCESS_PRIORITY: "processpriority",
  ROLE_CODE: "v3-RoleCode",
  LENSE_TYPE: "lens-type",
  CLAIM_TYPE: "claim-type",
  CLAIM_SUBTYPE: "claim-subtype",
  PAYEE_TYPE: "payeetype",
  CLAIM_CARE_TEAM_ROLE: "claimcareteamrole",
  PRACTICE_CODES: "practice-codes",
  CLAIM_INFO_CATEGORY: "claim-information-category",
  DIAG_ON_ADMISSION: "diagnosis-on-admission",
  DIAG_TYPE: "diagnosis-type",
  EXTENSION_TAX: "extension-tax",
  EXTENSION_PATIENT_SHARE: "extension-patient-share",
  EXTENSION_PACKAGE: "extension-package",
  EXTENSION_PATIENT_INVOICE: "extension-patientInvoice",
  TASK_CODE: "task-code",
  TASK_INPUT_TYPE: "task-input-type",
  TASK_REASON_CODE: "task-reason-code",
  EXTENSION_EPISODE: "extension-episode",
  EXTENSION_AUTH_OFFLINE_DATE: "extension-authorization-offline-date",
};

export const SUPPORT_INFO_KEY_NAMES = {
  info: "info",
  onset: "onset",
  attachment: "attachment",
  missingtooth: "missingtooth",
  hospitalized: "hospitalized",
  employmentImpacted: "employmentImpacted",
  reason_for_visit: "reason-for-visit",
  // supports unit
  vital_sign_weight: "vital-sign-weight",
  vital_sign_systolic: "vital-sign-systolic",
  vital_sign_diastolic: "vital-sign-diastolic",
  vital_sign_height: "vital-sign-height",
  icu_hours: "icu-hours",
  days_supply: "days-supply",
  lab_test: "lab-test",
  ventilation_hours: "ventilation-hours",
};
