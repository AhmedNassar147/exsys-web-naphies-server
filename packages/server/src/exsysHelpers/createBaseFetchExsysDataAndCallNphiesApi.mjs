/*
 *
 * Helper: `createBaseFetchExsysDataAndCallNphiesApi`.
 *
 */
import {
  writeResultFile,
  isObjectHasData,
  createCmdMessage,
} from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";

const createPrintResultsOrLog =
  (printValues) =>
  async ({ printData, error }) => {
    if (printValues) {
      await writeResultFile(printData);
      return;
    }

    if (error) {
      createCmdMessage({
        type: "error",
        message: error,
      });
    }
  };

const createBaseFetchExsysDataAndCallNphiesApi = async ({
  exsysQueryApiId,
  exsysSaveApiId,
  requestParams,
  requestBody,
  requestMethod,
  printValues,
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
    ...otherResults
  } = exsysResultsData;

  const printedErrorData = {
    requestParams,
    requestBody,
    exsysResultsData,
  };

  const printResultsOrLog = createPrintResultsOrLog(printValues);

  if (error_message || !isSuccess) {
    const errorMessage =
      error_message ||
      `error when calling exsys ${nphiesRequestName} \`${exsysQueryApiId}\` API`;

    await printResultsOrLog({
      printData: {
        folderName: printFolderName,
        data: printedErrorData,
        isError: true,
      },
      error: errorMessage,
    });

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
      errorMessage,
      hasError: true,
    };
  }

  if (!primaryKey || !isObjectHasData(otherResults)) {
    const errorMessage = `Exsys API failed sent empty ${exsysDataApiPrimaryKeyName} or result keys`;

    await printResultsOrLog({
      printData: {
        folderName: printFolderName,
        data: printedErrorData,
        isError: true,
      },
      error: errorMessage,
    });

    return {
      errorMessage,
      hasError: true,
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

  await printResultsOrLog({
    printData: {
      folderName: printFolderName,
      data: nphiesResultData,
      isError: hasError,
    },
    error: hasError ? `${errorMessageCode} - ${errorMessageCode}` : undefined,
  });

  const { message_event_type, message_event } = exsysResultsData;

  return {
    primaryKey,
    nphiesExtractedData: {
      ...nphiesExtractedData,
      messageEvent: message_event,
      messageEventType: message_event_type,
    },
    errorMessage,
    errorMessageCode,
    hasError,
  };
};

export default createBaseFetchExsysDataAndCallNphiesApi;
