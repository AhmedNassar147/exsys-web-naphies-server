/*
 *
 * Helper: `extractPollData`.
 *
 */
import { isObjectHasData } from "@exsys-web-server/helpers";
import createProductsData from "./createProductsData.mjs";
import extractNphiesSentDataErrors from "./extractNphiesSentDataErrors.mjs";

const extractPollData = (pollData, productsSentToNphies) => {
  const { nodeServerDataSentToNaphies, nphiesResponse, nphiesExtractedData } =
    pollData || {};

  if (!isObjectHasData(nphiesExtractedData)) {
    return undefined;
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
    productsData: extractedProductsData,
    claimErrors,
  } = nphiesExtractedData || {};

  const {
    productErrors,
    // supportInfoErrors,
    // diagnosisErrors,
    otherClaimErrors,
  } = extractNphiesSentDataErrors({
    claimErrors,
  });

  const productsData = createProductsData({
    extractedProductsData,
    productsSentToNphies,
    productErrors,
  });

  return {
    pollBundleId: bundleId,
    pollCreationBundleId: creationBundleId,
    pollIssueError: issueError,
    pollIssueErrorCode: issueErrorCode,
    pollResponseId: claimResponseId,
    pollRequestId: claimRequestId,
    pollOutcome: claimOutcome,
    pollDisposition: claimDisposition,
    pollPreAuthRef: claimPreauthRef,
    pollPeriod: [claimPeriodStart, claimPeriodEnd].filter(Boolean).join(" ~ "),
    pollExtensionCode: claimExtensionCode,
    pollErrors: otherClaimErrors,
    pollProductsData: productsData,
    pollNodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    pollNphiesResponse: nphiesResponse,
  };
};

export default extractPollData;
