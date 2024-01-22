/*
 *
 * Constants: 'exsys-web-naphies-server'.
 *
 */
import { collectProcessOptions } from "@exsys-web-server/helpers";

// --dev, --port,  ---ignore-cert, ---production, --exsys-base-url
export const CLI_CONFIG = await collectProcessOptions();

export const FILES_ENCODING_LIMIT = "60mb";

export const SERVER_PORT = 5000;
export const RETRY_TIMES = 1;
export const RETRY_DELAY = 10000;
export const EXSYS_POLLS_TIMEOUT = 10000;
const { exsysBaseUrl, port } = CLI_CONFIG;

export const BASE_API_IP_ADDRESS = exsysBaseUrl || "http://localhost";

const API_URL_PORT = port || 4200;

export const EXSYS_BASE_URL = `${BASE_API_IP_ADDRESS}:${API_URL_PORT}/ords/exsys_api`;

export const EXSYS_API_IDS_NAMES = {
  queryProgramOrganizations: "queryProgramOrganizations",
  queryExsysEligibilityData: "queryExsysEligibilityData", // this is a post method
  queryEligibilityPendingRequests: "queryEligibilityPendingRequests",
  saveNphiesResponseToExsys: "saveNphiesResponseToExsys",
  collectExsysPreauthData: "collectExsysPreauthData",
  savePreauthData: "savePreauthData",
  collectExsysClaimData: "collectExsysClaimData",
  saveClaimData: "saveClaimData",
  savePreauthPollData: "savePreauthPollData",
  saveClaimPollData: "saveClaimPollData",
  queryClaimOrPreauthDataToCancellation:
    "queryClaimOrPreauthDataToCancellation",
  queryBulkClaimsDataToCancellationOrCreation:
    "queryBulkClaimsDataToCancellationOrCreation",
  querySavedClaimsAndPreauthData: "querySavedClaimsAndPreauthData",
  collectExsysClaimOrPreauthCommunicationData:
    "collectExsysClaimOrPreauthCommunicationData",
  collectExsysClaimOrPreauthCommunicationRequestData:
    "collectExsysClaimOrPreauthCommunicationRequestData",
  saveExsysClaimOrPreauthCommunicationData:
    "saveExsysClaimOrPreauthCommunicationData",
  queryExsysClaimOrPreauthStatusCheckData:
    "queryExsysClaimOrPreauthStatusCheckData",
  saveExsysClaimOrPreauthStatusCheckData:
    "saveExsysClaimOrPreauthStatusCheckData",
  savePreauthOrClaimPollData: "savePreauthOrClaimPollData",
  saveClaimHistory: "saveClaimHistory",
  queryEligibilityDataFromCchi: "queryEligibilityDataFromCchi",
  uploadExsysClaimFile: "uploadExsysClaimFile",
  queryClaimsToCreatePdfFile: "queryClaimsToCreatePdfFile",
  saveCreatedClaimPdfStatus: "saveCreatedClaimPdfStatus",
};

export const CLIENT_NAMES = {
  exsys: "exsys",
  ahd_dmam: "ahd_dmam",
  sagaf: "sagaf",
  tadawi: "tadawi",
  blgoson: "blgoson",
  wecare: "wecare",
};

export const CLIENT_NAMES_KEYS = Object.keys(CLIENT_NAMES);

export const EXSYS_API_IDS = {
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/initiate_program_organizations?client=exsys
  [EXSYS_API_IDS_NAMES.queryProgramOrganizations]:
    "nphies_pkg/initiate_program_organizations",
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
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/collect_claim_to_cancel?authorization=13309012&patient_file_no=210997&organization_no=001&record_pk=6&request_type=priorauth
  [EXSYS_API_IDS_NAMES.queryClaimOrPreauthDataToCancellation]:
    "nphies_pkg/collect_claim_to_cancel",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/get_bulk_claim?authorization=4492758&&organization_no=001&soa_no=S00122/00690&request_type=send&nphies_request_type=claim
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/get_bulk_claim?authorization=4492758&&organization_no=001&soa_no=S00122/01021&request_type=cancel&nphies_request_type=claim
  [EXSYS_API_IDS_NAMES.queryBulkClaimsDataToCancellationOrCreation]:
    "nphies_pkg/get_bulk_claim",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/display_nphies_response?authorization=11796985&primary_key=6&request_type=priorauth
  [EXSYS_API_IDS_NAMES.querySavedClaimsAndPreauthData]:
    "nphies_pkg/display_nphies_response",
  // http://149.102.140.8:9090/ords/exsys_api/hs_nphies_preauth_pkg/collect_communication?authorization=111111&communication_pk=1&request_type=priorauth
  [EXSYS_API_IDS_NAMES.collectExsysClaimOrPreauthCommunicationData]:
    "hs_nphies_preauth_pkg/collect_communication",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/collect_send_communication?authorization=111111&organization_no=001&clinicalEntityNo=&communication_pk=121&request_type=claim
  [EXSYS_API_IDS_NAMES.collectExsysClaimOrPreauthCommunicationRequestData]:
    "nphies_pkg/collect_send_communication",
  // http://149.102.140.8:9090/ords/exsys_api/hs_nphies_preauth_pkg/update_communicat_send_status?communication_pk=&creation_bundle_id=&communication_id=&outcome=
  [EXSYS_API_IDS_NAMES.saveExsysClaimOrPreauthCommunicationData]:
    "hs_nphies_preauth_pkg/update_communicat_send_status",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/collect_claim_status_check?authorization=13309012&patient_file_no=210997&organization_no=001&record_pk=6&request_type=priorauth
  [EXSYS_API_IDS_NAMES.queryExsysClaimOrPreauthStatusCheckData]:
    "nphies_pkg/collect_claim_status_check",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/update_claim_status_check?claim_pk=&preauth_pk=&creation_bundle_id=&bundle_id=&outcome=
  [EXSYS_API_IDS_NAMES.saveExsysClaimOrPreauthStatusCheckData]:
    "nphies_pkg/update_claim_status_check",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/record_poll_data
  [EXSYS_API_IDS_NAMES.savePreauthOrClaimPollData]:
    "nphies_pkg/record_poll_data",
  // http://149.102.140.8:9090/ords/exsys_api/nphies_pkg/record_claim_data?claim_pk=1
  [EXSYS_API_IDS_NAMES.saveClaimHistory]: "nphies_pkg/record_claim_data",
  // http://149.102.140.8:9090/ords/exsys_api/hs_nphies_preauth_pkg/get_eligibility_data?authorization=111111&organization_no=001&customer_group_no=&customer_no=&insurance_company=
  [EXSYS_API_IDS_NAMES.queryEligibilityDataFromCchi]:
    "hs_nphies_preauth_pkg/get_eligibility_data",
  // http://149.102.140.8:9090/ords/exsys_api/hs_patient_billing_report/claim_upload_file?authorization=111111&dir=NPHIESSUPPORTINGINFO&sub_dir=S00122_00921&imageFileName=2211237066_206289_I00122-24720.PDF
  [EXSYS_API_IDS_NAMES.uploadExsysClaimFile]:
    "hs_patient_billing_report/claim_upload_file",
  // http://149.102.140.8:9090/ords/exsys_api/hs_patient_billing_report/collect_claim_to_create_pdf?authorization=111111&organization_no=001&attendance_type=O&soa_no=S00122/00921&patient_file_no=&date_from=&date_to&contract_no=
  [EXSYS_API_IDS_NAMES.queryClaimsToCreatePdfFile]:
    "hs_patient_billing_report/collect_claim_to_create_pdf",
  // http://149.102.140.8:9090/ords/exsys_api/hs_patient_billing_report/update_claim_create_pdf_status
  [EXSYS_API_IDS_NAMES.saveCreatedClaimPdfStatus]:
    "hs_patient_billing_report/update_claim_create_pdf_status",
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
  COMMUNICATION: "communication",
  COMMUNICATION_REQUEST: "CommunicationRequest",
  CANCEL: "cancel",
  STATUS_CHECK: "status-check",
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
  COMMUNICATION: "Communication",
  COMMUNICATION_REQUEST: "CommunicationRequest",
};

export const NPHIES_RESOURCE_MAP_TO_REQUEST_TYPE = {
  [NPHIES_REQUEST_TYPES.ELIGIBILITY]:
    NPHIES_RESOURCE_TYPES.COVERAGE_ELIGIBILITY_REQUEST,
  [NPHIES_REQUEST_TYPES.PREAUTH]: NPHIES_RESOURCE_TYPES.CLAIM,
  [NPHIES_REQUEST_TYPES.CLAIM]: NPHIES_RESOURCE_TYPES.CLAIM,
  [NPHIES_REQUEST_TYPES.POLL]: NPHIES_RESOURCE_TYPES.TASK,
  [NPHIES_REQUEST_TYPES.CANCEL]: NPHIES_RESOURCE_TYPES.TASK,
  [NPHIES_REQUEST_TYPES.COMMUNICATION]: NPHIES_RESOURCE_TYPES.COMMUNICATION,
  [NPHIES_REQUEST_TYPES.COMMUNICATION_REQUEST]:
    NPHIES_RESOURCE_TYPES.COMMUNICATION_REQUEST,
  [NPHIES_REQUEST_TYPES.STATUS_CHECK]: NPHIES_RESOURCE_TYPES.TASK,
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
  NATIONAL_ID_URL: `${BASE_NPHIES_URL}/identifier/nationalid`,
  PASSPORT_NO_URL: `${BASE_NPHIES_URL}/identifier/passportnumber`,
  VISA_NO_URL: `${BASE_NPHIES_URL}/identifier/DP`,
  BORDER_NO_URL: `${BASE_NPHIES_URL}/identifier/bordernumber`,
  PROVIDER_LICENSE_URL: `${BASE_NPHIES_LICENSE_URL}/provider-license`,
  PAYER_LICENSE_URL: `${BASE_NPHIES_LICENSE_URL}/payer-license`,
  LOCATION_LICENSE_URL: `${BASE_NPHIES_LICENSE_URL}/location-license`,
  PRACTITIONER_URL: `${BASE_NPHIES_LICENSE_URL}/practitioner-license`,
  NPHIES_LICENSE_OWNER_URL: `${BASE_NPHIES_LICENSE_URL}/nphies`,
  NPHIES_CHECK_INSURANCE_PRODUCTION: "https://hsb.nphies.sa/checkinsurance",
  NPHIES_CHECK_INSURANCE_DEVELOPMENT: "http://hsb.oba.nphies.sa/checkinsurance",
};

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
  PROFILE_COMMUNICATION: "communication|1.0.0",
  PROFILE_COMMUNICATION_REQUEST: "communication-request|1.0.0",
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
  EXTENSION_AUTH_ONLINE_RESPONSE: "extension-priorauth-response",
  EXT_PERIOD_START: "extension-batch-period",
  EXT_ACCOUNT_PERIOD: "extension-accountingPeriod",
  COMMUNICATION_CAT: "communication-category",
  EXTENSION_TRANSFER: "extension-transfer",
  RELATED_CLAIM_RELATION: "related-claim-relationship",
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
