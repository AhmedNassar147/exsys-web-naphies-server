/*
 *
 * Helper: `runPreauthorizationPoll`.
 *
 */
import chalk from "chalk";
import {
  delayProcess,
  writeResultFile,
  isObjectHasData,
  createCmdMessage,
} from "@exsys-web-server/helpers";
import savePreauthPollDataToExsys from "./savePreauthPollDataToExsys.mjs";
import { NPHIES_RESOURCE_TYPES, NPHIES_REQUEST_TYPES } from "../constants.mjs";
import createNphiesPreauthOrClaimPollData from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimPollData.mjs";
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractCoverageData from "../nphiesHelpers/extraction/extractCoverageData.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import extractMessageHeaderData from "../nphiesHelpers/extraction/extractMessageHeaderData.mjs";
import extractPreauthAndClaimPollTaskData from "../nphiesHelpers/extraction/extractPreauthAndClaimPollTaskData.mjs";
import extractCommunicationData from "../nphiesHelpers/extraction/extractCommunicationData.mjs";
import callNphiesApiAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import buildPrintedResultPath from "../helpers/buildPrintedResultPath.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;
const { PRESCRIBER } = NPHIES_REQUEST_TYPES;

const MAX_DELAY_TIMEOUT = 1 * 60 * 1000;
const MIN_DELAY_TIMEOUT = 5 * 1000;

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageData,
  Task: extractPreauthAndClaimPollTaskData,
  Bundle: ({ resource, creationBundleId }) =>
    mapEntriesAndExtractNeededData({
      nphiesResponse: resource,
      creationBundleId,
      extractionFunctionsMap: {
        [COVERAGE]: extractCoverageData,
        MessageHeader: extractMessageHeaderData(/-response|-request/),
        CommunicationRequest: extractCommunicationData,
        ClaimResponse: extractClaimResponseData,
      },
    }),
};

const runPreauthorizationPoll = async ({
  includeMessageType,
  excludeMessageType,
  preauthPollData,
  authorization,
  organizationNo,
  clinicalEntityNo,
}) => {
  const fullOptions = {
    includeMessageType,
    excludeMessageType,
    preauthPollData,
    authorization,
    organizationNo,
    clinicalEntityNo,
  };

  try {
    const options = {
      createNphiesRequestPayloadFn: () =>
        createNphiesPreauthOrClaimPollData({
          ...preauthPollData,
          includeMessageType,
          excludeMessageType,
        }),
      exsysResultsData: {
        organizationNo,
        clinicalEntityNo,
        ...preauthPollData,
      },
      setErrorIfExtractedDataFoundFn,
      extractionFunctionsMap,
      isAuthorizationPoll: true,
    };

    const { nphiesResultData, hasError } = await callNphiesApiAndCollectResults(
      options
    );

    const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
      nphiesResultData;

    const {
      mainBundleId,
      bundleId,
      creationBundleId,
      extractedTaskData,
      messageHeaderRequestType,
      messageHeaderResponseIdentifier,
      messageHeaderResponseCode,
      ...otherExtractedData
    } = nphiesExtractedData || {};

    const isPrescriberResponse = (messageHeaderRequestType || "").includes(
      PRESCRIBER
    );

    if (!isObjectHasData(otherExtractedData)) {
      createCmdMessage({
        type: "info",
        message: `${
          isPrescriberResponse ? "medicationsValidation" : "Authorization"
        } poll has no messages yet`,
      });

      await delayProcess(MAX_DELAY_TIMEOUT);
      await runPreauthorizationPoll(fullOptions);
      return;
    }

    const folderName = buildPrintedResultPath({
      organizationNo,
      clinicalEntityNo,
      skipThrowingOrganizationError: true,
      innerFolderName: isPrescriberResponse
        ? "medications_Validation_poll"
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
      message: `Error when running preauth polling, ${chalk.bold.white(
        `re-running the poll in ${MAX_DELAY_TIMEOUT / 1000} minutes`
      )}  `,
      data: error,
    });

    await delayProcess(MAX_DELAY_TIMEOUT);
    await runPreauthorizationPoll(fullOptions);
  }
};

export default runPreauthorizationPoll;
