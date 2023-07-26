/*
 *
 * Helper: `createBaseFetchExsysDataAndCallNphiesApi`.
 *
 */
import { isObjectHasData } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";

const createBaseFetchExsysDataAndCallNphiesApi = async ({
  exsysQueryApiId,
  exsysSaveApiId,
  requestParams,
  requestBody,
  requestMethod,
  createResultsDataFromExsysResponse,
  nphiesRequestName,
  printFolderName,
  exsysDataApiPrimaryKeyName,
  createNphiesRequestPayloadFn,
  extractionFunctionsMap,
  setErrorIfExtractedDataFoundFn,
  createExsysSaveApiParams,
  createExsysErrorSaveApiBody,
  onNphiesResponseWithSuccessFn,
  noPatientDataLogger,
}) => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: exsysQueryApiId,
    requestMethod,
    requestParams,
    body: requestBody,
  });

  const exsysResultsData = await createResultsDataFromExsysResponse(
    result || {}
  );
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

  if (
    !noPatientDataLogger &&
    [patient_file_no, patient_name, memberid].some((v) => !v)
  ) {
    console.error(
      "[patient_file_no, patient_name, memberid] fields should be in results data"
    );
  }

  if (error_message || !isSuccess) {
    const errorMessage =
      error_message ||
      `error when calling exsys ${nphiesRequestName} \`${exsysQueryApiId}\` API`;

    if (exsysSaveApiId) {
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
        isError: true,
      },
      loggerValue: errorMessage,
      resultData: {
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
        isError: true,
      },
      loggerValue: errorMessage,
      resultData: {
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
  });

  const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
    nphiesResultData;

  if (exsysSaveApiId && isNphiesServerConnected) {
    const successSaveParams = createExsysSaveApiParams
      ? createExsysSaveApiParams({
          primaryKey,
          exsysDataApiPrimaryKeyName,
          nphiesExtractedData,
        })
      : undefined;

    await createExsysRequest({
      resourceName: exsysSaveApiId,
      requestParams: successSaveParams,
      body: {
        [exsysDataApiPrimaryKeyName]: primaryKey,
        nodeServerDataSentToNaphies,
        nphiesResponse,
        nphiesExtractedData,
      },
    });
  }

  if (onNphiesResponseWithSuccessFn && isNphiesServerConnected) {
    await onNphiesResponseWithSuccessFn({
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    });
  }

  return {
    printData: {
      folderName: printFolderName,
      data: nphiesResultData,
      isError: hasError,
    },
    loggerValue: [errorMessage, errorMessageCode].filter(Boolean).join(" - "),
    resultData: {
      primaryKey,
      nphiesExtractedData: {
        ...nphiesExtractedData,
        messageEvent: message_event,
        messageEventType: message_event_type,
        patientFileNo: patient_file_no,
        patientName: patient_name,
        patientCardNo: memberid,
      },
      errorMessage,
      errorMessageCode,
      hasError,
    },
  };
};

export default createBaseFetchExsysDataAndCallNphiesApi;
