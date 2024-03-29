/*
 *
 * Helper: `createNphiesPreauthOrClaimCancellationData`.
 *
 */
import createPreauthOrClaimCancelOrStatusCheckData from "./createPreauthOrClaimCancelOrStatusCheckData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { CANCEL } = NPHIES_REQUEST_TYPES;

const createNphiesPreauthOrClaimCancellationData =
  (nullifyRequest) =>
  ({ cancellation_request_id, cancellation_reason_code, ...otherData }) =>
    createPreauthOrClaimCancelOrStatusCheckData({
      requestType: CANCEL,
      operationRequestId: cancellation_request_id,
      cancellationReasonCode: cancellation_reason_code,
      nullifyRequest,
      ...otherData,
    });

export default createNphiesPreauthOrClaimCancellationData;
