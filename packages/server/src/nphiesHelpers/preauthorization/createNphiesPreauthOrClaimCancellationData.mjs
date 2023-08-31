/*
 *
 * Helper: `createNphiesPreauthOrClaimCancellationData`.
 *
 */
import createPreauthOrClaimCancelOrStatusCheckData from "./createPreauthOrClaimCancelOrStatusCheckData.mjs";

const createNphiesPreauthOrClaimCancellationData =
  (requestType) =>
  ({ cancellation_request_id, cancellation_reason_code, ...otherData }) =>
    createPreauthOrClaimCancelOrStatusCheckData({
      operationRequestId: cancellation_request_id,
      cancellationReasonCode: cancellation_reason_code,
      requestType,
      ...otherData,
    });

export default createNphiesPreauthOrClaimCancellationData;
