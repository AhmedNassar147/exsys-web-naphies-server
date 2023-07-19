/*
 *
 * Helper: `runPreauthorizationPoll`.
 *
 */
import {
  delayProcess,
  createUUID,
  writeResultFile,
  isObjectHasData,
} from "@exsys-web-server/helpers";
import {
  SERVER_CONFIG,
  NPHIES_REQUEST_TYPES,
  NPHIES_RESOURCE_TYPES,
  EXSYS_API_IDS_NAMES,
} from "../constants.mjs";
import createProviderUrls from "../nphiesHelpers/base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../nphiesHelpers/base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../nphiesHelpers/base/createNphiesMessageHeader.mjs";
import createNphiesTaskData from "../nphiesHelpers/base/createNphiesTaskData.mjs";
import createOrganizationData from "../nphiesHelpers/base/createOrganizationData.mjs";
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import callNphiesApiAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";

const { preauthPollData } = SERVER_CONFIG;
const { POLL } = NPHIES_REQUEST_TYPES;
const { COVERAGE } = NPHIES_RESOURCE_TYPES;
const { savePreauthAndClaimPollData } = EXSYS_API_IDS_NAMES;

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
      ClaimResponse: extractClaimResponseData,
    }),
};

const PREAUTH_TIMEOUT = 3 * 60 * 1000;

const createNphiesRequestPayloadFn = () => {
  const requestId = createUUID();

  const { providerOrganizationUrl, providerFocusUrl } = createProviderUrls({
    providerBaseUrl: siteUrl,
    requestType: POLL,
  });

  return {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense,
        requestId,
        providerFocusUrl,
        requestType: POLL,
      }),
      createNphiesTaskData({
        providerOrganization,
        requestId,
        providerFocusUrl,
      }),
      createOrganizationData({
        organizationLicense: providerLicense,
        organizationReference: providerOrganization,
        siteName,
        providerOrganizationUrl,
        isProvider: true,
      }),
    ],
  };
};

const runPreauthorizationPoll = async () => {
  try {
    const options = {
      createNphiesRequestPayloadFn,
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

    const { mainBundleId, bundleId, ...otherExtractedData } =
      nphiesExtractedData || {};

    if (!isObjectHasData(otherExtractedData)) {
      console.log("authorization poll has no messages yet", otherExtractedData);
      return;
    }

    const { claimRequestId, claimOutcome, claimPreauthRef, claimResponseId } =
      otherExtractedData;

    // await createExsysRequest({
    //   resourceName: savePreauthAndClaimPollData,
    //   requestParams: {
    //     claimRequestId,
    //     claimResponseId,
    //     claimOutcome,
    //     claimPreauthRef,
    //   },
    //   body: {
    //     nodeServerDataSentToNaphies,
    //     nphiesResponse,
    //     nphiesExtractedData,
    //   },
    // });

    await writeResultFile({
      folderName: "authorizationPoll",
      data: nphiesResultData,
      isError: hasError,
    });
  } catch (error) {
    console.log("error from polling runPreauthorizationPoll", error);
  } finally {
    await delayProcess(PREAUTH_TIMEOUT);
    await runPreauthorizationPoll();
  }
};

export default runPreauthorizationPoll;
