/*
 *
 * Helper: `fetchExsysEligibilityDataAndCallNphies`.
 *
 */
import { writeResultFile } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import extractCoverageEligibilityEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEligibilityEntryResponseData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/eligibility/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const { getExsysDataBasedPatient, saveNphiesResponseToExsys } =
  EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  CoverageEligibilityResponse: extractCoverageEligibilityEntryResponseData,
  [COVERAGE]: extractCoverageEntryResponseData,
};

const setErrorIfExtractedDataFoundFn = ({
  eligibilityErrors,
  coverageErrors,
}) => [...(eligibilityErrors || []), ...(coverageErrors || [])];

const respondToExsysWithError = (primaryKey, errorMessage) =>
  createExsysRequest({
    resourceName: saveNphiesResponseToExsys,
    body: {
      primaryKey,
      nphiesExtractedData: {
        eligibilityOutcome: "error",
        isPatientEligible: "N",
        eligibilityDisposition: errorMessage,
      },
    },
  });

const fetchExsysEligibilityDataAndCallNphies = async ({
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

    await respondToExsysWithError(primaryKey, errorMessage);

    return {
      errorMessage,
      hasError: true,
    };
  }

  if (!primaryKey || !data) {
    const error = "Exsys API failed sent empty primaryKey or data keys";
    console.error(error);
    // if (printValues) {
    //   await writeResultFile({
    //     folderName: "eligibility",
    //     data: {
    //       primaryKey,
    //       exsysResultsData: data,
    //       exsysAPiBodyData,
    //     },
    //     isError: true,
    //   });
    // }
    // await respondToExsysWithError(primaryKey,error);
    return {
      errorMessage: error,
      hasError: true,
    };
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
      folderName: "eligibility",
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

export default fetchExsysEligibilityDataAndCallNphies;
