/*
 *
 * Helper: `extractPreauthOrClaimCancellationResponseData`.
 *
 */
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractPreauthOrClaimCancellationResponseData = ({
  resource: { status, identifier, id, focus, error, output, reasonCode },
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
    ...extractNphiesOutputErrors(output, "type"),
  ];

  const requestOrResponseId = responseId.replace(/Cancel_|resp_/g, "") || id;
  const isClaimCancellation = type === "Claim";

  const { code: reasonCodeValue } =
    extractNphiesCodeAndDisplayFromCodingType(reasonCode);

  return {
    cancellationResourceType: isClaimCancellation
      ? "ClaimCancellation"
      : "PreauthCancellation",
    cancellationResponseId: requestOrResponseId,
    cancellationRequestId: queuedRequestId.replace("req_", ""),
    cancellationStatus: status,
    cancellationOutcome: status,
    cancellationReasonCode: reasonCodeValue,
    cancellationErrors: errors,
  };
};

export default extractPreauthOrClaimCancellationResponseData;
