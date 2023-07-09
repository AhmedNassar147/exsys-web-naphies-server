/*
 *
 * Helper: `fetchExsysPreauthorizationDataAndCallNphies`.
 *
 */
import { writeResultFile } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const { getExsysDataBasedPatient, saveNphiesResponseToExsys } =
  EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ coverageErrors }) => [
  ...(coverageErrors || []),
];

const fetchExsysPreauthorizationDataAndCallNphies = async ({
  requestParams,
  exsysApiId,
  requestMethod,
  exsysAPiBodyData,
  printValues = true,
}) => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: exsysApiId || getExsysDataBasedPatient,
    body: exsysAPiBodyData,
    requestMethod,
    requestParams,
  });

  const { primaryKey, data } = result || {};
  const { error_message } = data || {};

  if (error_message || !isSuccess) {
    console.error("Exsys API failed");

    if (printValues) {
      await writeResultFile({
        folderName: "eligibility",
        data: {
          primaryKey,
          exsysResultsData: data,
          exsysAPiBodyData,
        },
        isError: true,
      });
    }

    const errorMessage =
      error_message ||
      `error calling exsys \`${getExsysDataBasedPatient}\` API`;

    return {
      errorMessage,
      hasError: true,
    };
  }

  if (!primaryKey || !data) {
    console.error("Exsys API failed sent empty primaryKey or data keys");
    return {};
  }

  const { nphiesResultData, hasError, errorMessage, errorMessageCode } =
    await callNphiesAPIAndCollectResults({
      exsysResultsData: data,
      createNphiesRequestPayloadFn,
      extractionFunctionsMap,
      setErrorIfExtractedDataFoundFn,
      otherPrintValues: {
        primaryKey,
      },
    });

  const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
    nphiesResultData;

  await createExsysRequest({
    resourceName: saveNphiesResponseToExsys,
    body: {
      primaryKey,
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    },
  });

  if (printValues) {
    await writeResultFile({
      folderName: "preauthorization",
      data: nphiesResultData,
      isError: hasError,
    });
  }

  return {
    primaryKey,
    nphiesExtractedData,
    errorMessage,
    errorMessageCode,
    hasError,
  };
};

export default fetchExsysPreauthorizationDataAndCallNphies;
