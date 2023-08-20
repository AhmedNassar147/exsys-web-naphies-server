/*
 *
 * helper: `fetchPreauthAndClaimSavedData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
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

  const { request_type, primary_key } = requestParams;

  const printFolderName = `exsysToFrontEndSavedData/${request_type}/${primary_key}`;

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

  const { nphiesExtractedData } = result;

  const extractionFunction =
    request_type === "eligibility"
      ? extractEligibilityDataSentToNphies
      : extractPreauthOrClaimDataSentToNphies;

  const extractedData = extractionFunction(result);

  const { claimErrors } = nphiesExtractedData || {};
  const hasError = !!isArrayHasData(claimErrors);

  const {
    nodeServerDataSentToNphies,
    nphiesResponse: _nphiesResponse,
    cancellationNphiesResponse,
    cancellationExsysRequestData,
    ..._extractedData
  } = extractedData;

  return {
    printData: {
      folderName: printFolderName,
      data: { ...basePrintedData, extractedData: _extractedData },
      hasNphiesApiError: hasError,
    },
    resultData: {
      extractedData,
    },
  };
};

export default fetchPreauthAndClaimSavedData;
