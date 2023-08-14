/*
 *
 * helper: `fetchPreauthAndClaimSavedData`.
 *
 */
import { EXSYS_API_IDS_NAMES, EXSYS_API_IDS } from "../constants.mjs";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import extractPreauthOrClaimDataSentToNphies from "../exsysToFrontEndHelpers/claimOrPreauth/index.mjs";
import extractEligibilityDataSentToNphies from "../exsysToFrontEndHelpers/eligibility/index.mjs";

const { querySavedClaimsAndPreauthData } = EXSYS_API_IDS_NAMES;
const baseApiUrl = EXSYS_API_IDS[querySavedClaimsAndPreauthData];

const fetchPreauthAndClaimSavedData = async (requestParams) => {
  const { isSuccess, error, result } = await createExsysRequest({
    resourceName: querySavedClaimsAndPreauthData,
    requestMethod: "GET",
    requestParams,
  });

  const basePrintedData = {
    requestParams,
    exsysResultsData: result,
  };

  const { request_type } = requestParams;

  const printFolderName = `exsysToFrontEndSavedData/${request_type}`;

  if (!isSuccess || error) {
    const errorMessage = error || `error when calling exsys ${baseApiUrl} API`;

    return {
      printData: {
        folderName: printFolderName,
        data: basePrintedData,
        hasExsysApiError: true,
      },
      loggerValue: errorMessage,
      resultData: {
        errorMessage,
        hasError: true,
      },
    };
  }

  const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
    result;

  if (!nodeServerDataSentToNaphies || !nphiesResponse || !nphiesExtractedData) {
    const errorMessage =
      "exsys response should has [nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse]";
    return {
      printData: {
        folderName: printFolderName,
        data: basePrintedData,
        hasExsysApiError: true,
      },
      loggerValue: errorMessage,
      resultData: {
        errorMessage,
        hasError: true,
      },
    };
  }

  const extractionFunction =
    request_type === "eligibility"
      ? extractEligibilityDataSentToNphies
      : extractPreauthOrClaimDataSentToNphies;

  const extractedData = extractionFunction(result);

  const { claimErrors } = nphiesExtractedData;
  const hasError = !!claimErrors.length;

  return {
    printData: {
      folderName: printFolderName,
      data: { ...basePrintedData, extractedData },
      hasNphiesApiError: hasError,
    },
    resultData: {
      extractedData,
    },
  };
};

export default fetchPreauthAndClaimSavedData;
