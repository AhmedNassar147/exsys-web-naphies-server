/*
 *
 * Helper: `fetchClaimOrPreauthForSecondResponse`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import buildPrintedResultPath from "../helpers/buildPrintedResultPath.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import savePreauthPollDataToExsys from "../polls/savePreauthPollDataToExsys.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { queryClaimOrPreauthDataForSecondResponse } = EXSYS_API_IDS_NAMES;

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];

const fetchClaimOrPreauthForSecondResponse = async ({
  authorization,
  requestType,
  primaryKey,
}) => {
  const requestParams = {
    authorization,
    request_type: requestType,
    primary_key: primaryKey,
  };

  const {
    result,
    error: exsysError,
    API_URL,
    isSuccess,
  } = await createExsysRequest({
    resourceName: queryClaimOrPreauthDataForSecondResponse,
    requestMethod: "GET",
    requestParams,
  });

  const { error_message, organization_no, clinicalEntityNo, data } =
    result || {};

  const printedErrorData = {
    API_URL,
    requestParams,
    exsysResultsData: result,
  };

  const printFolderPath = buildPrintedResultPath({
    organizationNo: organization_no,
    clinicalEntityNo,
    innerFolderName: `${requestType}/secondResponse`,
    skipThrowingOrganizationError: true,
  });

  const __errorMessage =
    !isSuccess || error_message || exsysError
      ? error_message ||
        "error when calling exsys queryClaimOrPreauthDataForSecondResponse"
      : undefined;

  if (__errorMessage) {
    return {
      printData: {
        folderName: printFolderPath,
        data: printedErrorData,
        hasExsysApiError: true,
      },
      loggerValue: __errorMessage,
      resultData: {
        primaryKey,
        errorMessage: __errorMessage,
        hasError: true,
      },
    };
  }

  const isClaimType = requestType === NPHIES_REQUEST_TYPES.CLAIM;

  const {
    [isClaimType ? "claim_pk" : "preauth_pk"]: currentPrimaryKey,
    nodeServerDataSentToNaphies,
  } = data || {};

  if (!currentPrimaryKey || !nodeServerDataSentToNaphies) {
    const errorMessage =
      "Couldn't find claim_pk , preauth_pk or nodeServerDataSentToNaphies in data from exsys";

    return {
      printData: {
        folderName: printFolderPath,
        data: printedErrorData,
        hasExsysApiError: true,
      },
      loggerValue: errorMessage,
      resultData: {
        primaryKey,
        errorMessage: errorMessage,
        hasError: true,
      },
    };
  }

  const {
    nphiesResultData,
    hasError,
    errorMessage,
    errorMessageCode,
    isNphiesServerConnected,
  } = await callNphiesAPIAndCollectResults({
    exsysResultsData: result,
    extractionRequestType: requestType,
    preparedNphiesRequestPayload: nodeServerDataSentToNaphies,
    setErrorIfExtractedDataFoundFn,
  });

  const {
    nphiesExtractedData,
    nphiesResponse,
    nodeServerDataSentToNaphies: jsonSentToNphies,
  } = nphiesResultData;

  const isNphiesServerNotConnected = !isNphiesServerConnected;

  const {
    claimRequestId,
    claimPreauthRef,
    claimResponseId,
    productsData,
    mainBundleId,
    bundleId,
    creationBundleId,
    claimMessageEventType,
    patientFileNo,
    patientName,
    patientIdentifierId,
  } = nphiesExtractedData || {};

  if (
    isNphiesServerConnected &&
    nphiesExtractedData &&
    claimRequestId &&
    claimResponseId &&
    claimPreauthRef &&
    isArrayHasData(productsData)
  ) {
    await savePreauthPollDataToExsys({
      authorization,
      organizationNo: organization_no,
      clinicalEntityNo,
      nphiesExtractedData,
      requestType,
      nodeServerDataSentToNaphies: jsonSentToNphies,
      nphiesResponse,
    });
  }

  const folderName = [
    printFolderPath,
    bundleId || mainBundleId || creationBundleId,
  ]
    .filter(Boolean)
    .join("/");

  return {
    printData: {
      folderName,
      data: {
        API_URL,
        exsysRequestParams: requestParams,
        ...nphiesResultData,
      },
      hasNphiesApiError: hasError,
    },
    loggerValue: [errorMessage, errorMessageCode].filter(Boolean).join(" - "),
    resultData: {
      primaryKey: currentPrimaryKey,
      isNphiesServerNotConnected,
      nphiesExtractedData: {
        ...(nphiesExtractedData || null),
        messageEvent: requestType,
        messageEventType: claimMessageEventType,
        patientFileNo: patientFileNo,
        patientName: patientName,
        patientCardNo: patientIdentifierId,
        nodeServerDataSentToNphies: jsonSentToNphies,
        nphiesResponse,
      },
      errorMessage,
      errorMessageCode,
      hasError,
    },
  };
};

export default fetchClaimOrPreauthForSecondResponse;
