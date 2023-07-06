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
import createProviderUrls from "../nphiesHelpers/base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../nphiesHelpers/base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../nphiesHelpers/base/createNphiesMessageHeader.mjs";
import createNphiesTaskData from "../nphiesHelpers/base/createNphiesTaskData.mjs";
import createOrganizationData from "../nphiesHelpers/base/createOrganizationData.mjs";
import callNphiesApiAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";

const { preauthData } = SERVER_CONFIG;
const { POLL } = NPHIES_REQUEST_TYPES;

const { siteUrl, siteName, providerLicense, providerOrganization } =
  preauthData;

const setErrorIfExtractedDataFoundFn = console.log;
const extractionFunctionsMap = {};

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

const runAuthorizationPoll = async () => {
  try {
    const options = {
      createNphiesRequestPayloadFn,
      exsysResultsData: preauthData,
      setErrorIfExtractedDataFoundFn,
      extractionFunctionsMap,
    };

    const { nphiesResultData, hasError, errorMessage, errorMessageCode } =
      await callNphiesApiAndCollectResults(options);

    console.error("errorMessage", errorMessage);
    console.error("errorMessageCode", errorMessageCode);

    await writeResultFile({
      folderName: "authorizationPoll",
      data: nphiesResultData,
      isError: hasError,
    });
  } catch (error) {
    console.log("error from polling runAuthorizationPoll", error);
  } finally {
    delayProcess(EXSYS_POLLS_TIMEOUT);
    await runAuthorizationPoll();
  }
};

await runAuthorizationPoll();
