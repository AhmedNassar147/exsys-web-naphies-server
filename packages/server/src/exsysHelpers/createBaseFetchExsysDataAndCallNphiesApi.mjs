/*
 *
 * Helper: `createBaseFetchExsysDataAndCallNphiesApi`.
 *
 */
import { isObjectHasData } from "@exsys-web-server/helpers";
import { EXSYS_API_IDS } from "../constants.mjs";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";

const createBaseFetchExsysDataAndCallNphiesApi = async ({
  exsysQueryApiId,
  exsysSaveApiId,
  requestParams,
  requestBody,
  requestMethod,
  createResultsDataFromExsysResponse,
  printFolderName,
  exsysDataApiPrimaryKeyName,
  createNphiesRequestPayloadFn,
  extractionFunctionsMap,
  setErrorIfExtractedDataFoundFn,
  createExsysSaveApiParams,
  createExsysErrorSaveApiBody,
  onNphiesResponseWithSuccessFn,
  noPatientDataLogger,
  checkExsysDataValidationBeforeCallingNphies,
  exsysQueryApiDelayTimeout,
  nphiesApiDelayTimeout,
}) => {
  const {
    isSuccess,
    result,
    error: exsysError,
  } = await createExsysRequest({
    resourceName: exsysQueryApiId,
    requestMethod,
    requestParams,
    body: requestBody,
    startingDelayTimeout: exsysQueryApiDelayTimeout,
  });

  const _result = result || {};

  const exsysResultsData = createResultsDataFromExsysResponse
    ? await createResultsDataFromExsysResponse(_result)
    : _result;

  const {
    error_message,
    [exsysDataApiPrimaryKeyName]: primaryKey,
    message_event_type,
    message_event,
    patient_file_no,
    patient_name,
    memberid,
    ...otherResults
  } = exsysResultsData;

  const printedErrorData = {
    requestParams,
    requestBody,
    exsysResultsData,
  };

  const { shouldSaveDataToExsys, validationError } =
    checkExsysDataValidationBeforeCallingNphies
      ? checkExsysDataValidationBeforeCallingNphies(exsysResultsData)
      : {};

  const hasErrorMessageOrFailed =
    !!error_message || !isSuccess || !!exsysError || !!validationError;

  if (
    !noPatientDataLogger &&
    !hasErrorMessageOrFailed &&
    [patient_file_no, patient_name, memberid].some((value) => !value)
  ) {
    console.error(
      `[patient_file_no, patient_name, memberid] fields should be found in ${EXSYS_API_IDS[exsysQueryApiId]}`
    );
  }

  if (hasErrorMessageOrFailed) {
    const errorMessage =
      error_message ||
      exsysError ||
      validationError ||
      `error when calling exsys \`${EXSYS_API_IDS[exsysQueryApiId]}\` API`;

    if (exsysSaveApiId && (!!validationError ? shouldSaveDataToExsys : true)) {
      const errorSaveParams = createExsysSaveApiParams
        ? createExsysSaveApiParams({
            primaryKey,
            exsysDataApiPrimaryKeyName,
            nphiesExtractedData: {},
          })
        : undefined;

      await createExsysRequest({
        resourceName: exsysSaveApiId,
        requestParams: errorSaveParams,
        body: {
          [exsysDataApiPrimaryKeyName]: primaryKey,
          ...(createExsysErrorSaveApiBody(errorMessage) || null),
        },
      });
    }

    return {
      printData: {
        folderName: printFolderName,
        data: printedErrorData,
        hasExsysApiError: true,
      },
      loggerValue: errorMessage,
      resultData: {
        primaryKey,
        errorMessage,
        hasError: true,
      },
    };
  }

  if (!primaryKey || !isObjectHasData(otherResults)) {
    const errorMessage = `Exsys API failed sent empty ${exsysDataApiPrimaryKeyName} or result keys`;
    return {
      printData: {
        folderName: printFolderName,
        data: printedErrorData,
        hasExsysApiError: true,
      },
      loggerValue: errorMessage,
      resultData: {
        primaryKey,
        errorMessage,
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
    exsysResultsData: exsysResultsData,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    nphiesApiDelayTimeout,
  });

  const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
    nphiesResultData;

  const isSizeLimitExceeded = errorMessageCode === "SIZE_LIMIT_EXCEEDED";

  if (exsysSaveApiId) {
    const successSaveParams = createExsysSaveApiParams
      ? createExsysSaveApiParams({
          primaryKey,
          exsysDataApiPrimaryKeyName,
          nphiesExtractedData: nphiesExtractedData || {},
          isSizeLimitExceeded,
        })
      : undefined;

    await createExsysRequest({
      resourceName: exsysSaveApiId,
      requestParams: successSaveParams,
      body: {
        [exsysDataApiPrimaryKeyName]: primaryKey,
        nodeServerDataSentToNaphies,
        nphiesResponse,
        ...(!isNphiesServerConnected || isSizeLimitExceeded
          ? createExsysErrorSaveApiBody(errorMessage) || null
          : {
              nphiesExtractedData: nphiesExtractedData || {},
            }),
      },
    });
  }

  if (onNphiesResponseWithSuccessFn) {
    await onNphiesResponseWithSuccessFn({
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
      exsysResultsData,
      isSizeLimitExceeded,
    });
  }

  const { mainBundleId, bundleId, creationBundleId } =
    nphiesExtractedData || {};

  const folderName = `${printFolderName}${
    message_event ? `/${message_event}` : ""
  }/${bundleId || mainBundleId || creationBundleId}`;

  return {
    printData: {
      folderName,
      data: {
        exsysRequstParams: requestParams,
        exsysRequstBody: requestBody,
        ...nphiesResultData,
      },
      hasNphiesApiError: hasError,
    },
    loggerValue: [errorMessage, errorMessageCode].filter(Boolean).join(" - "),
    resultData: {
      primaryKey,
      nphiesExtractedData: {
        ...(nphiesExtractedData || null),
        messageEvent: message_event,
        messageEventType: message_event_type,
        patientFileNo: patient_file_no,
        patientName: patient_name,
        patientCardNo: memberid,
        nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
        nphiesResponse,
      },
      errorMessage,
      errorMessageCode,
      hasError,
    },
  };
};

export default createBaseFetchExsysDataAndCallNphiesApi;
