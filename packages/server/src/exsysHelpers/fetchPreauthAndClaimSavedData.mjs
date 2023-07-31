/*
 *
 * helper: `fetchPreauthAndClaimSavedData`.
 *
 */
import { EXSYS_API_IDS_NAMES, EXSYS_API_IDS } from "../constants.mjs";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import extractPreauthOrClaimDataSentToNphies from "../exsysToFrontEndHelpers/extractPreauthOrClaimDataSentToNphies.mjs";

const { querySavedClaimsAndPreauthData } = EXSYS_API_IDS_NAMES;
const baseApiUrl = EXSYS_API_IDS[querySavedClaimsAndPreauthData];

const fetchPreauthAndClaimSavedData = async (requestParams) => {
  const { isSuccess, error, result } = await createExsysRequest({
    resourceName: querySavedClaimsAndPreauthData,
    requestMethod: "GET",
    requestParams,
  });

  const printedErrorData = {
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
        data: printedErrorData,
        hasExsysApiError: true,
      },
      loggerValue: errorMessage,
      resultData: {
        errorMessage,
        hasError: true,
      },
    };
  }

  const { nphiesExtractedData, nodeServerDataSentToNaphies } = result;

  const extractedData = extractPreauthOrClaimDataSentToNphies({
    nphiesExtractedData,
    nodeServerDataSentToNaphies,
  });

  const { claimErrors } = nphiesExtractedData;
  const hasError = !!claimErrors.length;

  return {
    printData: {
      folderName: printFolderName,
      data: { requestParams, extractedData },
      hasNphiesApiError: hasError,
    },
    resultData: {
      hasError,
      extractedData,
    },
  };
};

export default fetchPreauthAndClaimSavedData;
