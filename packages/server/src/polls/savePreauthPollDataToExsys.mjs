/*
 *
 * Helper: `savePreauthPollDataToExsys`.
 *
 */
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES } from "../constants.mjs";

const { savePreauthAndClaimPollData } = EXSYS_API_IDS_NAMES;

const savePreauthPollDataToExsys = async ({
  authorization,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
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

  return await createExsysRequest({
    resourceName: savePreauthAndClaimPollData,
    requestParams: {
      authorization,
      claimRequestId,
      claimResponseId,
      claimOutcome,
      claimPreauthRef,
      claimPeriodStart,
      claimPeriodEnd,
      claimExtensionCode,
    },
    body: {
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    },
  });
};

export default savePreauthPollDataToExsys;
