/*
 *
 * Helper: `extractPreauthOrClaimCancellationResponseData`.
 *
 */
import extractErrorsArray from "./extractErrorsArray.mjs";

const extractPreauthOrClaimCancellationResponseData = ({
  status,
  identifier,
  id,
  focus,
  error,
}) => {
  const [{ value: responseId }] = identifier || [{}];

  const {
    identifier: { value: queuedRequestId },
    type,
  } = focus || {
    identifier: {},
  };

  const errors = extractErrorsArray(error);

  const requestOrResponseId = responseId.replace("Cancel_", "") || id;
  const isClaimCancellation = type === "Claim";

  return {
    cancellationResourceType: isClaimCancellation
      ? "ClaimCancellation"
      : "PreauthCancellation",
    cancellationResponseId: requestOrResponseId,
    cancellationRequestId: requestOrResponseId,
    cancellationQueuedRequestId: queuedRequestId.replace("req_", ""),
    cancellationStatus: status,
    cancellationOutcome: status,
    cancellationErrors: errors,
  };
};

export default extractPreauthOrClaimCancellationResponseData;
