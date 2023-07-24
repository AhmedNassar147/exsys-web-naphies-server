/*
 *
 * Helper: `savePreauthPollDataToExsys`.
 *
 */
import chalk from "chalk";
import { createCmdMessage } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { saveClaimData, savePreauthPollData } = EXSYS_API_IDS_NAMES;

const SAVE_API_BASED_REQUEST_TYPE = {
  [NPHIES_REQUEST_TYPES.CLAIM]: saveClaimData,
  [NPHIES_REQUEST_TYPES.PREAUTH]: savePreauthPollData,
};

const savePreauthPollDataToExsys = async ({
  authorization,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
  requestType,
}) => {
  const {
    claimRequestId,
    claimOutcome,
    claimPreauthRef,
    claimResponseId,
    claimPeriodStart,
    claimPeriodEnd,
    claimExtensionCode,
  } = nphiesExtractedData;

  const saveApiName = SAVE_API_BASED_REQUEST_TYPE[requestType];

  if (!saveApiName) {
    createCmdMessage({
      type: "error",
      message: `requestType should be one of ${chalk.white.bold(
        Object.keys(SAVE_API_BASED_REQUEST_TYPE)
      )}`,
    });
    return;
  }

  return await createExsysRequest({
    resourceName: saveApiName,
    requestParams: {
      authorization,
      claimrequestid: claimRequestId,
      claimresponseid: claimResponseId,
      claimoutcome: claimOutcome,
      claimpreauthref: claimPreauthRef,
      claimperiodstart: claimPeriodStart,
      claimperiodend: claimPeriodEnd,
      claimextensioncode: claimExtensionCode,
    },
    body: {
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    },
  });
};

export default savePreauthPollDataToExsys;
