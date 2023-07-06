/*
 *
 * Helper: `runAuthorizationPoll`.
 *
 */
import {
  delayProcess,
  createUUID,
  writeResultFile,
} from "@exsys-web-server/helpers";
import {
  SERVER_CONFIG,
  EXSYS_POLLS_TIMEOUT,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";
import createNphiesRequest from "../helpers/createNphiesRequest.mjs";
import createProviderUrls from "../nphiesHelpers/base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../nphiesHelpers/base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../nphiesHelpers/base/createNphiesMessageHeader.mjs";
import createNphiesTaskData from "../nphiesHelpers/base/createNphiesTaskData.mjs";
import createOrganizationData from "../nphiesHelpers/base/createOrganizationData.mjs";

const { preauthData } = SERVER_CONFIG;
const { POLL } = NPHIES_REQUEST_TYPES;

const { siteUrl, siteName, providerLicense, providerOrganization } =
  preauthData;

const createNphiesRequestPayload = () => {
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

const fetchNphiesMessageData = () =>
  new Promise(async (resolve) => {
    const nphiesRequestPayload = createNphiesRequestPayload();

    const nphiesResults = await createNphiesRequest({
      bodyData: nphiesRequestPayload,
    });
    const { isSuccess, result: nphiesResponse, ...restResult } = nphiesResults;

    let nphiesResultData = {
      isSuccess,
      ...restResult,
      exsysResultsData: preauthData,
      nodeServerDataSentToNaphies: nphiesResults,
      nphiesResponse,
    };

    let errorMessage = restResult.error;
    let errorMessageCode = undefined;
    let hasError = !isSuccess;

    const extractedData = mapEntriesAndExtractNeededData(nphiesResponse, {});
  });

const runAuthorizationPoll = async () => {
  try {
    await fetchNphiesMessageData();
  } catch (error) {
    console.log("error from polling runAuthorizationPoll", error);
  } finally {
    delayProcess(EXSYS_POLLS_TIMEOUT);
    await runAuthorizationPoll();
  }
};

await runAuthorizationPoll();
