/*
 *
 * Helper: `fetchExsysPreauthorizationDataAndCallNphies`.
 *
 */
import { writeResultFile } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
// import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const printFolderName = "preauthorization";

const { collectExsysPreauthData, savePreauthData } = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
  ClaimResponse: extractClaimResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];

const respondToExsysWithError = (preauth_pk, errorMessage) =>
  createExsysRequest({
    resourceName: savePreauthData,
    requestParams: {
      preauth_pk,
      outcome: "error",
      request_preauth_id: undefined,
      claim_response_id: undefined,
      outcome: undefined,
      adjudication_outcome: undefined,
    },
    body: {
      preauth_pk,
      nphiesExtractedData: {
        claimOutcome: "error",
        issueError: errorMessage,
      },
    },
  });

const fetchExsysPreauthorizationDataAndCallNphies = async ({
  requestParams,
  requestMethod,
  frontEndData,
  printValues = true,
}) => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: collectExsysPreauthData,
    requestMethod,
    requestParams,
  });

  const { error_message, preauth_pk } = result || {};
  const _frontEndData = frontEndData || {};

  // const { extraSupportInformationData, ...otherFrontData } = _frontEndData;
  // const curedExtraSupportInformationData =
  //   await convertSupportInfoAttachmentUrlsToBase64(extraSupportInformationData);

  const exsysResultsData = {
    ...(result || {}),
    ..._frontEndData,
    // ...otherFrontData,
    // extraSupportInformationData: curedExtraSupportInformationData
  };

  if (error_message || !isSuccess) {
    console.error("Preauth Exsys API failed");

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
      `error calling exsys Preauth \`${getExsysDataBasedPatient}\` API`;

    await respondToExsysWithError(preauth_pk, errorMessage);

    return {
      errorMessage,
      hasError: true,
    };
  }

  if (!preauth_pk || !result) {
    const error = "Exsys API failed sent empty preauth_pk or result keys";
    console.error(error);

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
  const { claimRequestId, claimResponseId, claimOutcome, claimExtensionCode } =
    nphiesExtractedData;

  await createExsysRequest({
    resourceName: savePreauthData,
    requestParams: {
      preauth_pk,
      request_preauth_id: claimRequestId,
      claim_response_id: claimResponseId,
      outcome: claimOutcome,
      adjudication_outcome: claimExtensionCode,
    },
    body: {
      preauth_pk,
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    },
  });

  if (printValues) {
    await writeResultFile({
      folderName: printFolderName,
      data: nphiesResultData,
      isError: hasError,
    });
  }

  return {
    primaryKey: preauth_pk,
    nphiesExtractedData,
    errorMessage,
    errorMessageCode,
    hasError,
  };
};

export default fetchExsysPreauthorizationDataAndCallNphies;
