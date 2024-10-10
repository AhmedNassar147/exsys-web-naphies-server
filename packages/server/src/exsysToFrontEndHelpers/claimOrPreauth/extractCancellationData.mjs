/*
 *
 * Helper: `extractCancellationData`.
 *
 */
import { isObjectHasData } from "@exsys-web-server/helpers";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";

const extractCancellationData = (cancellationData) => {
  const { nodeServerDataSentToNaphies, nphiesResponse, nphiesExtractedData } =
    cancellationData || {};

  if (!isObjectHasData(nphiesExtractedData)) {
    return undefined;
  }

  const { nphiesRequestExtractedData } = nphiesExtractedData;

  const result = isObjectHasData(nphiesRequestExtractedData)
    ? nphiesExtractedData
    : mapEntriesAndExtractNeededData({
        requestType: NPHIES_REQUEST_TYPES.CANCEL,
        nphiesResponse,
        nodeServerDataSentToNaphies,
        defaultValue: {},
      });

  const {
    bundleId,
    creationBundleId,
    issueError,
    issueErrorCode,
    cancellationResponseId,
    cancellationRequestId,
    cancellationStatus,
    cancellationOutcome,
    cancellationReasonCode,
    cancellationErrors,
  } = result;

  return {
    cancellationBundleId: bundleId,
    cancellationCreationBundleId: creationBundleId,
    cancellationIssueError: issueError,
    cancellationIssueErrorCode: issueErrorCode,
    cancellationResponseId,
    cancellationRequestId,
    cancellationStatus,
    cancellationOutcome,
    cancellationReasonCode,
    cancellationErrors,
    cancellationNodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    cancellationNphiesResponse: nphiesResponse,
  };
};

export default extractCancellationData;
