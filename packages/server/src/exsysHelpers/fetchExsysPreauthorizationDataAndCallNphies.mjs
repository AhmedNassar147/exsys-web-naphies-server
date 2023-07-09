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

const printFolderName = "preauthorization";

const { collectExsysPreauthData, saveNphiesResponseToExsys } =
  EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ coverageErrors }) => [
  ...(coverageErrors || []),
];

const respondToExsysWithError = (preauth_pk, errorMessage) => null;
// createExsysRequest({
//   resourceName: saveNphiesResponseToExsys,
//   body: {
//     preauth_pk,
//     nphiesExtractedData: {
//       eligibilityOutcome: "error",
//       isPatientEligible: "N",
//       eligibilityDisposition: errorMessage,
//     },
//   },
// });

const fetchExsysPreauthorizationDataAndCallNphies = async ({
  requestParams,
  // exsysApiId,
  requestMethod,
  frontEndData,
  printValues = true,
}) => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: collectExsysPreauthData,
    requestMethod,
    requestParams,
  });

  const { data } = result || {};
  const { error_message, preauth_pk } = data || {};
  const __frontEndData = frontEndData || {};

  const exsysResultsData = {
    ...(data || {}),
    ...__frontEndData,
  };

  if (error_message || !isSuccess) {
    console.error("Exsys API failed");

    if (printValues) {
      await writeResultFile({
        folderName: printFolderName,
        data: {
          exsysResultsData,
          requestParams,
        },
        isError: true,
      });
    }

    const errorMessage =
      error_message ||
      `error calling exsys \`${getExsysDataBasedPatient}\` API`;

    await respondToExsysWithError(preauth_pk, errorMessage);

    return {
      errorMessage,
      hasError: true,
    };
  }

  if (!preauth_pk || !data) {
    const error = "Exsys API failed sent empty preauth_pk or data keys";
    console.error(error);
    return {
      errorMessage: error,
      hasError: true,
    };
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

  // await createExsysRequest({
  //   resourceName: saveNphiesResponseToExsys,
  //   body: {
  //     preauth_pk,
  //     nodeServerDataSentToNaphies,
  //     nphiesResponse,
  //     nphiesExtractedData,
  //   },
  // });

  if (printValues) {
    await writeResultFile({
      folderName: printFolderName,
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
