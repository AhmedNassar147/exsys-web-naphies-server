/*
 *
 * Helper: `mapEntriesAndExtractNeededData`.
 *
 */
import {
  findRootYarnWorkSpaces,
  readJsonFile,
  writeResultFile,
} from "@exsys-web-server/helpers";
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";
import getEntriesResourceIndicesMap from "../base/getEntriesResourceIndicesMap.mjs";
import makeEntriesGroupByResourceType from "../base/makeEntriesGroupByResourceType.mjs";
import convertSentAttachmentBase64ToFileUrl from "../base/convertSentAttachmentBase64ToFileUrl.mjs";
import extractPatientData from "./extractPatientData.mjs";
import extractCoverageData from "./extractCoverageData.mjs";
import extractLocationData from "./extractLocationData.mjs";
import extractMessageHeaderData from "./extractMessageHeaderData.mjs";
import extractOrganizationsData from "./extractOrganizationsData.mjs";
import extractEligibilityRequestData from "./extractEligibilityRequestData.mjs";
import extractEligibilityResponseData from "./extractEligibilityResponseData.mjs";
import extractClaimRequestData from "./extractClaimRequestData.mjs";
import extractClaimResponseData from "./extractClaimResponseData.mjs";
import extractPreauthAndClaimPollTaskData from "./extractPreauthAndClaimPollTaskData.mjs";
import extractAuthPollBundleEntry from "./extractAuthPollBundleEntry.mjs";
import extractExsysCommunicationEntryData from "./extractExsysCommunicationEntryData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const extractionFunctionsByRequestMap = {
  [NPHIES_REQUEST_TYPES.ELIGIBILITY]: {
    MessageHeader: extractMessageHeaderData(),
    CoverageEligibilityRequest: extractEligibilityRequestData,
    CoverageEligibilityResponse: extractEligibilityResponseData,
    Organization: extractOrganizationsData,
    Coverage: extractCoverageData,
    Patient: extractPatientData,
    Location: extractLocationData,
  },
  [NPHIES_REQUEST_TYPES.CLAIM]: {
    MessageHeader: extractMessageHeaderData(),
    Claim: extractClaimRequestData,
    ClaimResponse: extractClaimResponseData,
    Patient: extractPatientData,
    Coverage: extractCoverageData,
    Organization: extractOrganizationsData,
  },
  [NPHIES_REQUEST_TYPES.PREAUTH]: {
    MessageHeader: extractMessageHeaderData(),
    Claim: extractClaimRequestData,
    ClaimResponse: extractClaimResponseData,
    Patient: extractPatientData,
    Coverage: extractCoverageData,
    Organization: extractOrganizationsData,
  },
  [NPHIES_REQUEST_TYPES.POLL]: {
    MessageHeader: extractMessageHeaderData(),
    Organization: extractOrganizationsData,
    Coverage: extractCoverageData,
    Task: extractPreauthAndClaimPollTaskData,
    Bundle: extractAuthPollBundleEntry,
  },
  // NPHIES_REQUEST_TYPES.MEDICATION_REQUEST
  [NPHIES_REQUEST_TYPES.PRESCRIBER]: {
    MessageHeader: extractMessageHeaderData(),
    Organization: extractOrganizationsData,
    Claim: extractClaimRequestData,
    ClaimResponse: extractClaimResponseData,
    Patient: extractPatientData,
    Coverage: extractCoverageData,
  },
  [NPHIES_REQUEST_TYPES.CANCEL]: {
    MessageHeader: extractMessageHeaderData(),
    Organization: extractOrganizationsData,
    Patient: extractPatientData,
    Coverage: extractCoverageData,
    Task: (values) =>
      extractPreauthAndClaimPollTaskData({
        ...values,
        isCancellationTask: true,
      }),
  },
  [NPHIES_REQUEST_TYPES.STATUS_CHECK]: {
    MessageHeader: extractMessageHeaderData(),
    Organization: extractOrganizationsData,
    Patient: extractPatientData,
    Coverage: extractCoverageData,
    Task: (values) =>
      extractPreauthAndClaimPollTaskData({
        ...values,
        isStatusCheckTask: true,
      }),
  },
  [NPHIES_REQUEST_TYPES.COMMUNICATION]: extractExsysCommunicationEntryData,
  [NPHIES_REQUEST_TYPES.COMMUNICATION_REQUEST]:
    extractExsysCommunicationEntryData,
};

const createRunExtractionFunctions =
  (extractionFunctionsMap, mainRequestId) =>
  ({
    groupedEntries,
    timestamp,
    isRequest,
    nphiesResponseEntryResults,
    dataSentToNphiesIndicesMap,
  }) => {
    const keys = Object.keys(groupedEntries || {});

    if (keys.length && extractionFunctionsMap) {
      return keys.reduce(
        (acc, resourceType) => {
          const entryGroupArray = groupedEntries[resourceType];
          const extractionFn = extractionFunctionsMap[resourceType];

          if (extractionFn) {
            acc = {
              ...acc,
              ...extractionFn({
                entryGroupArray,
                mainRequestId,
                isRequest,
                groupedEntries,
                nphiesResponseEntryResults,
                dataSentToNphiesIndicesMap,
              }),
            };
          }

          return acc;
        },
        { timestamp }
      );
    }

    return null;
  };

const mapEntriesAndExtractNeededData = ({
  nodeServerDataSentToNaphies,
  nphiesResponse,
  defaultValue,
  requestType,
}) => {
  const { entry, id, issue, timestamp } = nphiesResponse || {};
  const issueValues = formatNphiesResponseIssue(issue);

  const {
    id: mainRequestId,
    entry: requestEntries,
    timestamp: requestTimestamp,
  } = nodeServerDataSentToNaphies || {};

  const groupedNphiesRequestEntries = convertSentAttachmentBase64ToFileUrl(
    makeEntriesGroupByResourceType(requestEntries)
  );

  const groupedNphiesResponseEntries = makeEntriesGroupByResourceType(entry);

  const shouldResultsToObjectOfData =
    !!groupedNphiesResponseEntries ||
    !!groupedNphiesRequestEntries ||
    !!issueValues;

  const extractionFunctionsMap = extractionFunctionsByRequestMap[requestType];

  const runExtractionFunctions = createRunExtractionFunctions(
    extractionFunctionsMap,
    mainRequestId
  );

  const nphiesResponseEntryResults = runExtractionFunctions({
    groupedEntries: groupedNphiesResponseEntries,
    timestamp,
  });

  const dataSentToNphiesIndicesMap = getEntriesResourceIndicesMap(
    nodeServerDataSentToNaphies
  );

  const nphiesRequestEntryResults = runExtractionFunctions({
    groupedEntries: groupedNphiesRequestEntries,
    timestamp: requestTimestamp,
    isRequest: true,
    nphiesResponseEntryResults,
    dataSentToNphiesIndicesMap,
  });

  const isPreauthOrClaimPool = requestType === NPHIES_REQUEST_TYPES.POLL;

  const result = shouldResultsToObjectOfData
    ? {
        creationBundleId: mainRequestId,
        ...(isPreauthOrClaimPool ? { mainBundleId: id } : null),
        bundleId: id,
        ...issueValues,
        ...nphiesResponseEntryResults,
        nphiesRequestExtractedData: nphiesRequestEntryResults,
        // groupedNphiesResponseEntries,
        // groupedNphiesRequestEntries,
      }
    : undefined;

  return result || defaultValue;
};

export default mapEntriesAndExtractNeededData;

// const base = await findRootYarnWorkSpaces();
// const [{ nodeServerDataSentToNaphies, nphiesResponse }] = await readJsonFile(
//   // `${base}/results/new-arc/elg-poll.json`,
//   // `${base}/results/new-arc/priorauth.json`,
//   // `${base}/results/new-arc/priorauth2.json`,
//   // `${base}/results/new-arc/advanced-authorization/28-09-2024.json`,
//   // `${base}/results/new-arc/advanced-authorization/29-09-2024.json`,
//   // `${base}/results/new-arc/claim-poll/--02-10-2024.json`,
//   // `${base}/results/new-arc/claim-poll/--25-09-2024.json`,
//   // `${base}/results/new-arc/claim-poll/02-10-2024.json`,
//   // `${base}/results/new-arc/claim-poll/25-09-2024.json`,
//   // `${base}/results/new-arc/claim-poll/26-09-2024.json`,
//   // `${base}/results/new-arc/auth-poll/01-10-2024.json`,
//   // `${base}/results/new-arc/auth-poll/02-10-2024.json`,
//   // `${base}/results/new-arc/auth-poll/03-10-2024.json`,
//   // `${base}/results/new-arc/auth-poll/25-09-2024.json`,
//   // `${base}/results/new-arc/auth-poll/26-09-2024.json`,
//   // `${base}/results/new-arc/auth-poll/29-09-2024.json`,
//   // `${base}/results/new-arc/cancel-request/--25-09-2024.json`,
//   // `${base}/results/new-arc/cancel-request/25-09-2024.json`,
//   // `${base}/results/new-arc/empty-poll/empty1.json`,
//   // `${base}/results/new-arc/empty-poll/empty2.json`,
//   // `${base}/results/new-arc/empty-poll/empty3.json`,
//   // `${base}/results/new-arc/empty-poll/empty4.json`,
//   // `${base}/results/new-arc/empty-poll/empty4.json`,
//   // `${base}/results/new-arc/statusCheck/priorauth-check-12-09-2024.json`,
//   // `${base}/results/new-arc/statusCheck/--priorauth-check-12-09-2024.json`,
//   // `${base}/results/new-arc/communication-poll/01-10-2024.json`,
//   // `${base}/results/new-arc/communication-poll/03-10-2024.json`,
//   // `${base}/results/new-arc/communication-poll/26-09-2024.json`,
//   // `${base}/results/new-arc/communication-poll/28-09-2024.json`,
//   // `${base}/results/new-arc/communication-poll/29-09-2024.json`,
//   // `${base}/results/new-arc/communication-poll/30-09-2024.json`,
// `${base}/results/blg/priorauth/aaf63ac6-3ccc-4aa5-a021-e98494e424b9/23-10-2024.json`,
// `${base}/results/nphies-all.json`,
// `${base}/results/Claim Professional with WPA Request.json`,
//   `${base}/results/exsys/test2.json`,
//   true
// );

// await writeResultFile({
//   data: mapEntriesAndExtractNeededData({
//     nodeServerDataSentToNaphies,
//     nphiesResponse,
// requestType: NPHIES_REQUEST_TYPES.ELIGIBILITY,
// requestType: NPHIES_REQUEST_TYPES.PREAUTH,
// requestType: NPHIES_REQUEST_TYPES.POLL,
// requestType: NPHIES_REQUEST_TYPES.CANCEL,
// requestType: NPHIES_REQUEST_TYPES.STATUS_CHECK,
// requestType: NPHIES_REQUEST_TYPES.POLL,
// requestType: NPHIES_REQUEST_TYPES.CLAIM,
//   requestType: NPHIES_REQUEST_TYPES.COMMUNICATION,
// }),
// folderName: `new-arc/results/elg-poll`,
// folderName: `new-arc/results/priorauth`,
// folderName: `new-arc/results/priorauth2`,
// folderName: `new-arc/results/claim-poll--02-10-2024.json`,
// folderName: `new-arc/results/claim-poll--25-09-2024.json`,
// folderName: `new-arc/results/claim-poll-25-09-2024.json`,
// folderName: `new-arc/results/claim-poll-26-09-2024.json`,
// folderName: `new-arc/results/auth-poll-01-10-2024.json`,
// folderName: `new-arc/results/auth-poll-02-10-2024.json`,
// folderName: `new-arc/results/auth-poll-03-10-2024.json`,
// folderName: `new-arc/results/auth-poll-25-09-2024.json`,
// folderName: `new-arc/results/auth-poll-26-09-2024.json`,
// folderName: `new-arc/results/auth-poll-29-09-2024.json`,
// folderName: `new-arc/results/cancel-request--25-09-2024.json`,
// folderName: `new-arc/results/cancel-request-25-09-2024.json`,
// folderName: `new-arc/results/empty-poll-empty1.json`,
// folderName: `new-arc/results/empty-poll-empty2.json`,
// folderName: `new-arc/results/empty-poll-empty3.json`,
// folderName: `new-arc/results/empty-poll-empty4.json`,
// folderName: `new-arc/results/statusCheck-priorauth-check-12-09-2024.json`,
// folderName: `new-arc/results/statusCheck--priorauth-check-12-09-2024.json`,
// folderName: `new-arc/results/communication-poll-01-10-2024.json`,
// folderName: `new-arc/results/communication-poll-03-10-2024.json`,
// folderName: `new-arc/results/communication-poll-26-09-2024.json`,
// folderName: `new-arc/results/communication-poll-28-09-2024.json`,
// folderName: `new-arc/results/communication-poll-29-09-2024.json`,
// folderName: `new-arc/results/communication-poll-30-09-2024.json`,
// folderName: `blg/priorauth/aaf63ac6-3ccc-4aa5-a021-e98494e424b9/23-10-2024-result`,
// folderName: `nphies-all-result`,
// folderName: `Claim Professional with WPA Request-RES`,
// folderName: `exsys-test2`,
// });
