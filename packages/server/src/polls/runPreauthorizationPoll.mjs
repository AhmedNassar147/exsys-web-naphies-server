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
  isArrayHasData,
} from "@exsys-web-server/helpers";
import { NPHIES_REQUEST_TYPES } from "../constants.mjs";
import createNphiesPreauthOrClaimPollData from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimPollData.mjs";
import callNphiesApiAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import buildPrintedResultPath from "../helpers/buildPrintedResultPath.mjs";
import mergePollBundlesAndSave from "./mergePollBundlesAndSave.mjs";

const { POLL } = NPHIES_REQUEST_TYPES;

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

    const { nphiesExtractedData } = nphiesResultData;

    const {
      pollBundles,
      mainBundleId,
      bundleId,
      creationBundleId,
      messageHeaderRequestType,
    } = nphiesExtractedData || {};

    if (!isArrayHasData(pollBundles)) {
      createCmdMessage({
        type: "info",
        message: `Authorization poll has no messages yet when request_type_is=${chalk.bold.white(
          messageHeaderRequestType
        )}`,
      });
      await delayProcess(MIN_DELAY_TIMEOUT);
      await runPreauthorizationPoll(fullOptions);

      return;
    }

    const folderName = buildPrintedResultPath({
      organizationNo,
      clinicalEntityNo,
      skipThrowingOrganizationError: true,
      innerFolderName: "poll_data",
      segments: [mainBundleId || bundleId || creationBundleId],
    });

    await writeResultFile({
      folderName,
      data: nphiesResultData,
      isError: hasError,
    });

    await mergePollBundlesAndSave({
      authorization,
      ...nphiesResultData,
    });

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
