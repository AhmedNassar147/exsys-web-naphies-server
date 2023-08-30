/*
 *
 * Helper: `extractPreauthOrClaimStatusCheckResponseData`.
 *
 */
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";

const extractPreauthOrClaimStatusCheckResponseData = ({
  resource: { status, identifier, id, focus, error, output },
}) => {
  const [responseId] = extractIdentifierData(identifier);

  const {
    identifier: { value: requestId },
    type,
  } = focus || {
    identifier: {},
  };

  const errors = [
    ...extractErrorsArray(error),
    ...extractNphiesOutputErrors(output),
    ...extractNphiesOutputErrors(output, "type"),
  ];

  const [{ valueCode }] = output || [{}];

  const requestOrResponseId = responseId.replace(/Cancel_|resp_/g, "") || id;
  const isClaim = type === "Claim";

  return {
    statusCheckResourceType: isClaim
      ? "ClaimStatusCheck"
      : "PreauthStatusCheck",
    statusCheckResponseId: requestOrResponseId,
    statusCheckRequestId: requestId.replace("req_", ""),
    statusCheckOutcome: valueCode,
    statusCheckStatus: status,
    statusCheckErrors: errors,
  };
};

export default extractPreauthOrClaimStatusCheckResponseData;
