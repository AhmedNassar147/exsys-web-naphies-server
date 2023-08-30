/*
 *
 * Helper: `createNphiesPreauthOrClaimStatusCheckData`.
 *
 */
import createPreauthOrClaimCancelOrStatusCheckData from "./createPreauthOrClaimCancelOrStatusCheckData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { STATUS_CHECK } = NPHIES_REQUEST_TYPES;

const createNphiesPreauthOrClaimStatusCheckData = ({
  status_check_request_id,
  ...otherData
}) =>
  createPreauthOrClaimCancelOrStatusCheckData({
    requestType: STATUS_CHECK,
    operationRequestId: status_check_request_id,
    ...otherData,
  });

export default createNphiesPreauthOrClaimStatusCheckData;
