/*
 *
 * Helper: `createBaseFetchExsysDataAndCallNphiesApi`.
 *
 */
import {
  isArrayHasData,
  isObjectHasData,
  toCamelCase,
} from "@exsys-web-server/helpers";
import { EXSYS_API_IDS, TEST_PATIENT_NAME } from "../constants.mjs";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import buildPrintedResultPath from "../helpers/buildPrintedResultPath.mjs";
import removeInvisibleCharactersFromString from "../helpers/removeInvisibleCharactersFromString.mjs";

const makeValueWithoutSpaces = (value) => (value || "").replace(/\s/g, "");

const replaceWithDefaultValue = (value, key) => {
  const fixedValue = removeInvisibleCharactersFromString(value);
  const valueWithoutSpaces = makeValueWithoutSpaces(fixedValue);

  if (!valueWithoutSpaces) {
    const fixedKey = toCamelCase(key.replace(/patient_|subscriber_/, ""));
    return TEST_PATIENT_NAME[fixedKey];
  }

  return fixedValue;
};

const fixExsysResultsData = (exsysResultsData) => {
  if (isObjectHasData(exsysResultsData)) {
    const {
      patient_file_no,
      patient_first_name,
      patient_second_name,
      patient_third_name,
      patient_family_name,
      memberid,
      iqama_no,
      subscriber_file_no,
      subscriber_phone,
      subscriber_iqama_no,
      subscriber_first_name,
      subscriber_second_name,
      subscriber_third_name,
      subscriber_family_name,
      site_name,
      patient_phone,
      network_name,
      doctorsData,
      ...otherData
    } = exsysResultsData;

    const dataToBeFixed = {
      patient_file_no,
      iqama_no,
      memberid,
      patient_first_name,
      patient_second_name,
      patient_third_name,
      patient_family_name,
      patient_phone,
      subscriber_file_no,
      subscriber_phone,
      subscriber_iqama_no,
      subscriber_first_name,
      subscriber_second_name,
      subscriber_third_name,
      subscriber_family_name,
      site_name,
      network_name,
    };

    const fixedData = Object.keys(dataToBeFixed).reduce((acc, key) => {
      const dataKeyValue = dataToBeFixed[key];

      const isKeyStartsWithPatientOrSubscriberAndEndsWithName = [
        "subscriber_",
        "patient_",
      ].some((start) => key.startsWith(start) && key.endsWith("_name"));

      if (isKeyStartsWithPatientOrSubscriberAndEndsWithName) {
        acc[key] = replaceWithDefaultValue(dataKeyValue, key);
      } else {
        const fixedValue = removeInvisibleCharactersFromString(dataKeyValue);
        const valueWithoutSpaces = makeValueWithoutSpaces(fixedValue);

        acc[key] = !valueWithoutSpaces ? undefined : fixedValue;
      }

      return acc;
    }, {});

    let fixedDoctorData;

    if (isArrayHasData(doctorsData)) {
      fixedDoctorData = doctorsData.map(
        ({
          first_name,
          second_name,
          third_name,
          family_name,
          ...otherDoctorData
        }) => ({
          ...otherDoctorData,
          first_name: replaceWithDefaultValue(first_name, "first_name"),
          second_name: replaceWithDefaultValue(second_name, "second_name"),
          third_name: replaceWithDefaultValue(third_name, "third_name"),
          family_name: replaceWithDefaultValue(family_name, "family_name"),
        })
      );
    }

    return {
      ...fixedData,
      doctorsData: fixedDoctorData,
      ...otherData,
    };
  }

  return exsysResultsData;
};

const createBaseFetchExsysDataAndCallNphiesApi = async ({
  exsysQueryApiId,
  exsysSaveApiId,
  requestParams,
  requestBody,
  requestMethod,
  extractionRequestType,
  createResultsDataFromExsysResponse,
  printFolderName,
  exsysDataApiPrimaryKeyName,
  createNphiesRequestPayloadFn,
  setErrorIfExtractedDataFoundFn,
  createExsysSaveApiParams,
  createExsysErrorSaveApiBody,
  onNphiesResponseWithSuccessFn,
  noPatientDataLogger,
  checkExsysDataValidationBeforeCallingNphies,
  checkPayloadNphiesSize,
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
  });

  const _result = result || {};

  let exsysResultsData = createResultsDataFromExsysResponse
    ? await createResultsDataFromExsysResponse(_result)
    : _result;

  exsysResultsData = fixExsysResultsData(exsysResultsData);

  const {
    error_message,
    [exsysDataApiPrimaryKeyName]: primaryKey,
    message_event_type,
    message_event,
    patient_file_no,
    patient_name,
    memberid,
    organization_no,
    organizationNo,
    clinicalEntityNo,
    ...otherResults
  } = exsysResultsData;

  const printedErrorData = {
    requestParams,
    requestBody,
    exsysResultsData,
  };

  const _organizationNo = organizationNo || organization_no;

  const printFolderPath = buildPrintedResultPath({
    organizationNo: _organizationNo,
    clinicalEntityNo,
    innerFolderName: printFolderName,
    skipThrowingOrganizationError: true,
  });

  const { shouldSaveDataToExsys, validationError, loggerMessage } =
    checkExsysDataValidationBeforeCallingNphies
      ? checkExsysDataValidationBeforeCallingNphies(exsysResultsData)
      : {};

  const hasNoOrganizationNo = !_organizationNo;

  const hasErrorMessageOrFailed =
    hasNoOrganizationNo ||
    !!error_message ||
    !isSuccess ||
    !!exsysError ||
    !!validationError;

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
    const hasAnyError =
      error_message || exsysError || validationError || hasErrorMessageOrFailed;
    const currentError = error_message || exsysError || validationError;

    const errorMessage = hasAnyError
      ? currentError
        ? currentError
        : "no organization no found"
      : `error when calling exsys \`${EXSYS_API_IDS[exsysQueryApiId]}\` API`;

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
        folderName: printFolderPath,
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
        folderName: printFolderPath,
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
    exsysResultsData,
    createNphiesRequestPayloadFn,
    setErrorIfExtractedDataFoundFn,
    checkPayloadNphiesSize,
    extractionRequestType,
  });

  const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
    nphiesResultData;

  const isNphiesServerNotConnected = !isNphiesServerConnected;

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
        ...(isNphiesServerNotConnected || isSizeLimitExceeded
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

  const folderName = [
    printFolderPath,
    message_event,
    bundleId || mainBundleId || creationBundleId,
  ]
    .filter(Boolean)
    .join("/");

  return {
    printData: {
      folderName,
      data: {
        exsysRequestParams: requestParams,
        exsysRequestBody: requestBody,
        loggerMessage,
        ...nphiesResultData,
      },
      hasNphiesApiError: hasError,
    },
    loggerValue: [errorMessage, errorMessageCode].filter(Boolean).join(" - "),
    resultData: {
      primaryKey,
      isNphiesServerNotConnected,
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
