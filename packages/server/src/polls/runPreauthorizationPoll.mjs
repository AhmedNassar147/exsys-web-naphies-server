/*
 *
 * Helper: `runPreauthorizationPoll`.
 *
 */
import {
  delayProcess,
  writeResultFile,
  isObjectHasData,
  createCmdMessage,
} from "@exsys-web-server/helpers";
import savePreauthPollDataToExsys from "./savePreauthPollDataToExsys.mjs";
import { SERVER_CONFIG, NPHIES_RESOURCE_TYPES } from "../constants.mjs";
import createNphiesPreauthOrClaimPollData from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimPollData.mjs";
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import extractMessageHeaderData from "../nphiesHelpers/extraction/extractMessageHeaderData.mjs";
import callNphiesApiAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";

const { preauthPollData, authorization } = SERVER_CONFIG;
const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const { siteUrl, siteName, providerLicense, providerOrganization } =
  preauthPollData;

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];
const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
  Bundle: (nphiesResponse) =>
    mapEntriesAndExtractNeededData(nphiesResponse, {
      [COVERAGE]: extractCoverageEntryResponseData,
      MessageHeader: extractMessageHeaderData,
      ClaimResponse: extractClaimResponseData,
    }),
};

const PREAUTH_TIMEOUT = 3 * 60 * 1000;

const runPreauthorizationPoll = async () => {
  try {
    const options = {
      createNphiesRequestPayloadFn: () =>
        createNphiesPreauthOrClaimPollData({
          providerLicense,
          providerOrganization,
          siteUrl,
          siteName,
        }),
      exsysResultsData: preauthPollData,
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
      messageHeaderRequestType,
      ...otherExtractedData
    } = nphiesExtractedData || {};

    if (!isObjectHasData(otherExtractedData)) {
      createCmdMessage({
        type: "info",
        message: `Authorization poll has no messages yet`,
      });
      return;
    }

    await savePreauthPollDataToExsys({
      authorization,
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
      requestType: messageHeaderRequestType,
    });

    await writeResultFile({
      folderName: "authorizationPoll",
      data: nphiesResultData,
      isError: hasError,
    });
  } catch (error) {
    createCmdMessage({
      type: "info",
      message: `Error from polling runPreauthorizationPoll\n ${error}`,
    });
  } finally {
    await delayProcess(PREAUTH_TIMEOUT);
    await runPreauthorizationPoll();
  }
};

export default runPreauthorizationPoll;
