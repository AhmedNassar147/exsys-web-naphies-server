/*
 *
 * Helper: `extractPollData`.
 *
 */
import { isObjectHasData } from "@exsys-web-server/helpers";
import extractNphiesSentDataErrors from "../../nphiesHelpers/extraction/extractNphiesSentDataErrors.mjs";
import getEntriesResourceIndicesMap from "../../nphiesHelpers/base/getEntriesResourceIndicesMap.mjs";
import createDiagnosisDataWithErrors from "../../nphiesHelpers/base/createDiagnosisDataWithErrors.mjs";
import createSupportInfoDataWithErrors from "../../nphiesHelpers/base/createSupportInfoDataWithErrors.mjs";
import createAndMergeProductsDataWithErrors from "../../nphiesHelpers/extraction/createAndMergeProductsDataWithErrors.mjs";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const extractPollData = (
  pollData,
  productsSentToNphies,
  supportingInfoSentToNphies,
  diagnosisSentToNphies
) => {
  const { nodeServerDataSentToNaphies, nphiesResponse, nphiesExtractedData } =
    pollData || {};

  if (!isObjectHasData(nphiesExtractedData)) {
    return undefined;
  }

  const { nphiesRequestExtractedData } = nphiesExtractedData;

  let result = isObjectHasData(nphiesRequestExtractedData)
    ? nphiesExtractedData
    : mapEntriesAndExtractNeededData({
        requestType: NPHIES_REQUEST_TYPES.POLL,
        nphiesResponse,
        nodeServerDataSentToNaphies,
        defaultValue: {},
      });

  if (!result || !result.claimResponseId) {
    result = mapEntriesAndExtractNeededData({
      requestType: NPHIES_REQUEST_TYPES.PREAUTH,
      nphiesResponse,
      nodeServerDataSentToNaphies,
      defaultValue: {},
    });
  }

  const {
    bundleId,
    creationBundleId,
    issueError,
    issueErrorCode,
    claimResponseId,
    claimRequestId,
    claimOutcome,
    claimDisposition,
    claimPreauthRef,
    claimPeriodStart,
    claimPeriodEnd,
    claimExtensionCode,
    claimPriority,
    processNotes,
    fundsReserveCode,
    productsData: extractedProductsData,
    addProductsData,
    claimErrors,
    totalAdjudicationValues,
  } = result || {};

  const dataSentToNphiesIndicesMap = getEntriesResourceIndicesMap(
    nodeServerDataSentToNaphies
  );

  const {
    productErrors,
    supportInfoErrors,
    diagnosisErrors,
    otherClaimErrors,
  } = extractNphiesSentDataErrors(dataSentToNphiesIndicesMap, claimErrors);

  const diagnosisData = createDiagnosisDataWithErrors(
    diagnosisSentToNphies,
    diagnosisErrors
  );

  const { productsData, totalValues } = createAndMergeProductsDataWithErrors({
    extractedProductsData,
    productsSentToNphies,
    productErrors,
  });

  const supportInfoData = createSupportInfoDataWithErrors(
    supportingInfoSentToNphies,
    supportInfoErrors
  );

  return {
    pollBundleId: bundleId,
    pollCreationBundleId: creationBundleId,
    pollIssueError: issueError,
    pollIssueErrorCode: issueErrorCode,
    pollRequestId: claimRequestId,
    pollResponseId: claimResponseId,
    pollOutcome: claimOutcome,
    pollDisposition: claimDisposition,
    pollPreAuthRef: claimPreauthRef,
    pollPeriod: [claimPeriodStart, claimPeriodEnd].filter(Boolean).join(" ~ "),
    pollExtensionCode: claimExtensionCode,
    pollErrors: otherClaimErrors,
    pollPriority: claimPriority,
    pollNotes: processNotes,
    pollFundsReserveCode: fundsReserveCode,
    pollProductsData: productsData,
    pollAddProductsData: addProductsData,
    pollSupportInfoData: supportInfoData,
    pollSupportDiagnosisData: diagnosisData,
    pollTotalAdjudicationValues: totalAdjudicationValues,
    ...(totalValues || null),
    pollNodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    pollNphiesResponse: nphiesResponse,
  };
};

export default extractPollData;
