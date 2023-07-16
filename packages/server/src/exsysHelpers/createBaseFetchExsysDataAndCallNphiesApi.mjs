/*
 *
 * Helper: `createBaseFetchExsysDataAndCallNphiesApi`.
 *
 */
import { writeResultFile, isObjectHasData } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";

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

  if (error_message || !isSuccess) {
    const errorMessage =
      error_message ||
      `error when calling exsys ${nphiesRequestName} \`${exsysQueryApiId}\` API`;

    await writeResultFile({
      folderName: printFolderName,
      data: printedErrorData,
      isError: true,
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
    const error = `Exsys API failed sent empty ${exsysDataApiPrimaryKeyName} or result keys`;

    await writeResultFile({
      folderName: printFolderName,
      data: printedErrorData,
      isError: true,
    });

    return {
      errorMessage: error,
      hasError: true,
    };
  }

  if (printFolderName === "claim") {
    console.log({
      prod: exsysResultsData.productsData,
      result,
    });
  }

  const { nphiesResultData, hasError, errorMessage, errorMessageCode } =
    await callNphiesAPIAndCollectResults({
      exsysResultsData: exsysResultsData,
      createNphiesRequestPayloadFn,
      extractionFunctionsMap,
      setErrorIfExtractedDataFoundFn,
    });

  const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
    nphiesResultData;

  if (exsysSaveApiId) {
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

  if (printValues) {
    await writeResultFile({
      folderName: printFolderName,
      data: nphiesResultData,
      isError: hasError,
    });
  }

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
