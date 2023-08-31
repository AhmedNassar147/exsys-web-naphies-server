import { writeResultFile } from "@exsys-web-server/helpers";
import callNphiesAPIAndCollectResults from "../nphiesHelpers/base/callNphiesApiAndCollectResults.mjs";
import createNphiesPreauthOrClaimPollData from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimPollData.mjs";

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];

const tryPollRequest = async (exsysResultsData) => {
  const { siteUrl, siteName, providerLicense, providerOrganization } =
    exsysResultsData;

  const options = {
    createNphiesRequestPayloadFn: () =>
      createNphiesPreauthOrClaimPollData({
        providerLicense,
        providerOrganization,
        siteUrl,
        siteName,
        usePollMessageInput: true,
      }),
    exsysResultsData,
    setErrorIfExtractedDataFoundFn,
    extractionFunctionsMap: {},
    isAuthorizationPoll: true,
  };

  const result = await callNphiesAPIAndCollectResults(options);

  await writeResultFile({
    folderName: "POLL_CHECK",
    data: result,
    isError: result.hasError,
  });
};

export default tryPollRequest;
