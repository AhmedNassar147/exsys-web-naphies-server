/*
 *
 * Helper: `extractPreauthOrClaimCancellationResponseData`.
 *
 */
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";

const extractPreauthOrClaimCancellationResponseData = ({
  resource: { status, identifier, id, focus, error, output },
}) => {
  const [responseId] = extractIdentifierData(identifier);

  const {
    identifier: { value: queuedRequestId },
    type,
  } = focus || {
    identifier: {},
  };

  const errors = [
    ...extractErrorsArray(error),
    ...extractNphiesOutputErrors(output),
  ];

  const requestOrResponseId = responseId.replace(/Cancel_|resp_/g, "") || id;
  const isClaimCancellation = type === "Claim";

  return {
    cancellationResourceType: isClaimCancellation
      ? "ClaimCancellation"
      : "PreauthCancellation",
    cancellationResponseId: requestOrResponseId,
    cancellationRequestId: queuedRequestId.replace("req_", ""),
    cancellationStatus: status,
    cancellationOutcome: status,
    cancellationErrors: errors,
  };
};

export default extractPreauthOrClaimCancellationResponseData;
