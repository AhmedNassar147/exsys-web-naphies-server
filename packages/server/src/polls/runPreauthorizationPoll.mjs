/*
 *
 * Helper: `runPreauthorizationPoll`.
 *
 */
import chalk from "chalk";
import {
  delayProcess,
  writeResultFile,
  createCmdMessage,
} from "@exsys-web-server/helpers";
import savePreauthPollDataToExsys from "./savePreauthPollDataToExsys.mjs";
import { NPHIES_REQUEST_TYPES } from "../constants.mjs";
import createNphiesPreauthOrClaimPollData from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimPollData.mjs";
import callNphiesApiAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import buildPrintedResultPath from "../helpers/buildPrintedResultPath.mjs";

const { PRESCRIBER, POLL } = NPHIES_REQUEST_TYPES;

const MAX_DELAY_TIMEOUT = 1 * 60 * 1000;
const MIN_DELAY_TIMEOUT = 5 * 1000;

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];

const runPreauthorizationPoll = async (fullOptions) => {
  const {
    includeMessageType,
    excludeMessageType,
    messagesCount,
    preauthPollData,
    authorization,
    organizationNo,
    clinicalEntityNo,
  } = fullOptions;

  try {
    const options = {
      createNphiesRequestPayloadFn: () =>
        createNphiesPreauthOrClaimPollData({
          ...preauthPollData,
          includeMessageType,
          excludeMessageType,
          messagesCount,
        }),
      exsysResultsData: {
        organizationNo,
        clinicalEntityNo,
        ...preauthPollData,
      },
      setErrorIfExtractedDataFoundFn,
      extractionRequestType: POLL,
    };

    const { nphiesResultData, hasError } = await callNphiesApiAndCollectResults(
      options
    );

    const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
      nphiesResultData;

    const {
      messageHeaderRequestType,
      originalHeaderRequestType,
      mainBundleId,
      bundleId,
      creationBundleId,
    } = nphiesExtractedData || {};
    const isEmptyPoll =
      messageHeaderRequestType === "poll" && !originalHeaderRequestType;

    const isPrescriberResponse = (messageHeaderRequestType || "").includes(
      PRESCRIBER
    );

    const folderName = buildPrintedResultPath({
      organizationNo,
      clinicalEntityNo,
      skipThrowingOrganizationError: true,
      innerFolderName: isPrescriberResponse
        ? "prescriptionPoll"
        : "authorizationPoll",
      segments: [
        messageHeaderRequestType,
        mainBundleId || bundleId || creationBundleId,
      ],
    });

    await writeResultFile({
      folderName,
      data: nphiesResultData,
      isError: hasError,
    });

    if (isEmptyPoll) {
      createCmdMessage({
        type: "info",
        message: `${
          isPrescriberResponse ? "prescription" : "Authorization"
        } poll has no messages yet ${chalk.bold.white(
          `when request_type_is=${messageHeaderRequestType}`
        )}`,
      });

      await delayProcess(MAX_DELAY_TIMEOUT);
      await runPreauthorizationPoll(fullOptions);
      return;
    }

    // await writeResultFile({
    //   folderName,
    //   data: nphiesResultData,
    //   isError: hasError,
    // });

    await savePreauthPollDataToExsys({
      authorization,
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
      requestType: messageHeaderRequestType,
    });

    await delayProcess(MIN_DELAY_TIMEOUT);
    await runPreauthorizationPoll(fullOptions);
  } catch (error) {
    createCmdMessage({
      type: "error",
      message: `Error when running preauth/prescription poll, ${chalk.bold.white(
        `re-running the poll in ${MAX_DELAY_TIMEOUT / 1000} minutes`
      )}  `,
      data: error,
    });

    await delayProcess(MAX_DELAY_TIMEOUT);
    await runPreauthorizationPoll(fullOptions);
  }
};

export default runPreauthorizationPoll;
