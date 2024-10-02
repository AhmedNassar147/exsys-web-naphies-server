/*
 *
 * Helper: `savePreauthPollDataToExsys`.
 *
 */
import chalk from "chalk";
import { createCmdMessage } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { saveClaimPollData, savePreauthPollData, savePreauthOrClaimPollData } =
  EXSYS_API_IDS_NAMES;

const SAVE_API_BASED_REQUEST_TYPE = {
  [NPHIES_REQUEST_TYPES.CLAIM]: saveClaimPollData,
  [NPHIES_REQUEST_TYPES.PREAUTH]: savePreauthPollData,
  [NPHIES_REQUEST_TYPES.PRESCRIBER]: savePreauthPollData,
};

const savePreauthPollDataToExsys = async ({
  authorization,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
  requestType,
  logParams,
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
    issueError,
    issueErrorCode,
  } = nphiesExtractedData;

  const { communicationAboutSystemType, communicationAboutId } =
    communicationExtractedData || {};

  let _requestType = requestType;

  if (communicationAboutSystemType === "authorization") {
    _requestType = NPHIES_REQUEST_TYPES.PREAUTH;
  }

  await createExsysRequest({
    resourceName: savePreauthOrClaimPollData,
    body: {
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    },
  });

  const saveApiName = SAVE_API_BASED_REQUEST_TYPE[_requestType];

  if (!saveApiName) {
    createCmdMessage({
      type: "error",
      message: `requestType should be one of ${chalk.white.bold(
        Object.keys(SAVE_API_BASED_REQUEST_TYPE)
      )} ${chalk.white.bold(`while the requestType=${requestType}`)}`,
    });
    return;
  }

  const _outcome =
    !claimOutcome || !!(issueError || issueErrorCode) ? "error" : claimOutcome;

  const requestParams = {
    authorization,
    claimresponseid: claimResponseId || "",
    claimpreauthref: claimPreauthRef || "",
    claimperiodstart: claimPeriodStart || "",
    claimperiodend: claimPeriodEnd || "",
    claimextensioncode: claimExtensionCode || "",
    claimrequestid: communicationAboutId || claimRequestId || "",
    claimoutcome: _outcome || "",
    claimmessageeventtype: requestType || claimMessageEventType,
    claimcreationbundleid: creationBundleId || "",
  };

  if (logParams) {
    console.log("requestParams", requestParams);
  }

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
