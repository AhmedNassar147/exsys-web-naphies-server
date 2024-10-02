/*
 *
 * Helper: `fetchExsysMedicationCheckingDataAndCallNphies`.
 *
 */
import { isArrayHasData, writeResultFile } from "@exsys-web-server/helpers";
import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import extractMessageHeaderData from "../nphiesHelpers/extraction/extractMessageHeaderData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/index.mjs";
import validateSupportInfoDataBeforeCallingNphies from "../nphiesHelpers/base/validateSupportInfoDataBeforeCallingNphies.mjs";
import savePreauthPollDataToExsys from "../polls/savePreauthPollDataToExsys.mjs";
import buildPrintedResultPath from "../helpers/buildPrintedResultPath.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;
const { PRESCRIBER } = NPHIES_REQUEST_TYPES;

const {
  collectExsysPreauthData,
  savePreauthData,
  // collectExsysClaimData,
  // saveClaimData,
  // saveClaimHistory,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  MessageHeader: extractMessageHeaderData(),
  [COVERAGE]: extractCoverageEntryResponseData,
  ClaimResponse: extractClaimResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) =>
  [coverageErrors, claimErrors].flat();

const createExsysSaveApiParams = ({
  primaryKey,
  isSizeLimitExceeded,
  nphiesExtractedData: {
    issueError,
    issueErrorCode,
    bundleId,
    claimRequestId,
    claimResponseId,
    claimOutcome,
    claimExtensionCode,
    creationBundleId,
  },
}) => {
  const _outcome =
    !claimOutcome || !!(issueError || issueErrorCode) ? "error" : claimOutcome;

  return {
    preauth_pk: primaryKey,
    bundle_id: bundleId,
    claim_request_id: claimRequestId,
    claim_response_id: claimResponseId,
    outcome: _outcome,
    adjudication_outcome: claimExtensionCode || _outcome,
    creation_bundle_id: creationBundleId,
    request_type: PRESCRIBER,
    size_limit_exceeded: isSizeLimitExceeded ? "Y" : "N",
  };
};

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    claimOutcome: "error",
    issueError: errorMessage,
  },
});

const CONFIG_MAP = {
  [PRESCRIBER]: {
    exsysDataApiPrimaryKeyName: "prescription_pk",
    exsysQueryApiId: collectExsysPreauthData,
    exsysSaveApiId: savePreauthData,
  },
};

const createResultsDataFromExsysResponse = async ({
  productsData,
  supportInformationData,
  ...result
}) => ({
  ...result,
  supportInformationData: await convertSupportInfoAttachmentUrlsToBase64(
    supportInformationData
  ),
  productsData: isArrayHasData(productsData)
    ? productsData.filter(Boolean)
    : [],
});

const checkExsysDataValidationBeforeCallingNphies =
  validateSupportInfoDataBeforeCallingNphies("supportInformationData", true);

const fetchExsysMedicationCheckingDataAndCallNphies = async ({
  requestParams,
  nphiesRequestType,
  isRunningFromPoll,
}) => {
  const { exsysQueryApiId, exsysDataApiPrimaryKeyName, exsysSaveApiId } =
    CONFIG_MAP[nphiesRequestType];

  const fullRequestParams = {
    ...requestParams,
    isPrescription: "Y",
  };

  const { authorization } = requestParams;

  const __printFolderName__ = [
    isRunningFromPoll ? "exsys" : "",
    `${PRESCRIBER}-request`,
    isRunningFromPoll ? "poll" : "",
  ]
    .filter(Boolean)
    .join("_");

  const onNphiesResponseWithSuccessFn = async (data) => {
    const {
      nphiesExtractedData,
      isSizeLimitExceeded,
      exsysResultsData,
      ...options
    } = data;
    const {
      claimRequestId,
      claimPreauthRef,
      claimResponseId,
      productsData,
      mainBundleId,
      bundleId,
      creationBundleId,
    } = nphiesExtractedData || {};

    const { organizationNo, organization_no, clinicalEntityNo } =
      exsysResultsData;

    if (
      nphiesExtractedData &&
      claimRequestId &&
      claimResponseId &&
      claimPreauthRef &&
      isArrayHasData(productsData)
    ) {
      await savePreauthPollDataToExsys({
        authorization,
        nphiesExtractedData,
        requestType: PRESCRIBER,
        ...options,
      });

      const folderName = buildPrintedResultPath({
        organizationNo: organizationNo || organization_no,
        clinicalEntityNo,
        skipThrowingOrganizationError: false,
        innerFolderName: __printFolderName__.replace("poll", "request-poll"),
        segments: [mainBundleId || bundleId || creationBundleId],
        shouldFilterSegments: true,
      });

      await writeResultFile({
        folderName,
        data,
      });
    }
  };

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId,
    exsysSaveApiId,
    requestParams: fullRequestParams,
    requestMethod: "GET",
    printFolderName: __printFolderName__,
    exsysDataApiPrimaryKeyName,
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    checkExsysDataValidationBeforeCallingNphies,
    onNphiesResponseWithSuccessFn,
    checkPayloadNphiesSize: true,
  });
};

export default fetchExsysMedicationCheckingDataAndCallNphies;
