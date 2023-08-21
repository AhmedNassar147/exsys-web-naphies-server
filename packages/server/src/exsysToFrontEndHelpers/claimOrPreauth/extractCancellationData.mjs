/*
 *
 * Helper: `extractCancellationData`.
 *
 */
import { isObjectHasData } from "@exsys-web-server/helpers";

const extractCancellationData = (cancellationData) => {
  const { nodeServerDataSentToNaphies, nphiesResponse, nphiesExtractedData } =
    cancellationData || {};

  if (!isObjectHasData(nphiesExtractedData)) {
    return undefined;
  }

  const {
    cancellationResponseId,
    cancellationRequestId,
    cancellationQueuedRequestId,
    cancellationStatus,
    cancellationOutcome,
    cancellationErrors,
    bundleId,
    creationBundleId,
    issueError,
    issueErrorCode,
  } = nphiesExtractedData || {};

  return {
    cancellationBundleId: bundleId,
    cancellationCreationBundleId: creationBundleId,
    cancellationIssueError: issueError,
    cancellationIssueErrorCode: issueErrorCode,
    cancellationResponseId,
    cancellationRequestId: cancellationQueuedRequestId || cancellationRequestId,
    cancellationStatus,
    cancellationOutcome,
    cancellationErrors,
    cancellationNodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    cancellationNphiesResponse: nphiesResponse,
  };
};

export default extractCancellationData;
