/*
 *
 * Helper: `savePreauthPollDataToExsys`.
 *
 */
import chalk from "chalk";
import { createCmdMessage } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { saveClaimPollData, savePreauthPollData } = EXSYS_API_IDS_NAMES;

const SAVE_API_BASED_REQUEST_TYPE = {
  [NPHIES_REQUEST_TYPES.CLAIM]: saveClaimPollData,
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
    claimMessageEventType,
    creationBundleId,
    communicationExtractedData,
  } = nphiesExtractedData;

  const { communicationAboutSystemType, communicationAboutId } =
    communicationExtractedData || {};

  let _requestType = requestType;

  if (communicationAboutSystemType === "authorization") {
    _requestType = NPHIES_REQUEST_TYPES.PREAUTH;
  }

  const saveApiName = SAVE_API_BASED_REQUEST_TYPE[_requestType];

  if (!saveApiName) {
    createCmdMessage({
      type: "error",
      message: `requestType should be one of ${chalk.white.bold(
        Object.keys(SAVE_API_BASED_REQUEST_TYPE)
      )}`,
    });
    return;
  }

  const requestParams = {
    authorization,
    claimresponseid: claimResponseId || "",
    claimpreauthref: claimPreauthRef || "",
    claimperiodstart: claimPeriodStart || "",
    claimperiodend: claimPeriodEnd || "",
    claimextensioncode: claimExtensionCode || "",
    claimrequestid: communicationAboutId || claimRequestId || "",
    claimoutcome: claimOutcome || "",
    claimmessageeventtype: claimMessageEventType,
    claimcreationbundleid: creationBundleId || "",
  };

  return await createExsysRequest({
    resourceName: saveApiName,
    requestParams,
    body: {
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    },
  });
};

export default savePreauthPollDataToExsys;
