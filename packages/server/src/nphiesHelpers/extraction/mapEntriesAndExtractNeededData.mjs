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
import extractEncounterRequestData from "./extractEncounterRequestData.mjs";
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
    Encounter: extractEncounterRequestData,
  },
  [NPHIES_REQUEST_TYPES.PREAUTH]: {
    MessageHeader: extractMessageHeaderData(),
    Claim: extractClaimRequestData,
    ClaimResponse: extractClaimResponseData,
    Patient: extractPatientData,
    Coverage: extractCoverageData,
    Organization: extractOrganizationsData,
    Encounter: extractEncounterRequestData,
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

  const { id: mainRequestId, timestamp: requestTimestamp } =
    nodeServerDataSentToNaphies || {};

  const { entry: requestEntries } =
    convertSentAttachmentBase64ToFileUrl(nodeServerDataSentToNaphies) || {};

  const groupedNphiesRequestEntries =
    makeEntriesGroupByResourceType(requestEntries);

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
//   `${base}/results/nphies-response(professional) (12).json`,
//   true
// );

// await writeResultFile({
//   data: mapEntriesAndExtractNeededData({
//     nodeServerDataSentToNaphies,
//     nphiesResponse,
//     requestType: NPHIES_REQUEST_TYPES.PREAUTH,
//   }),
//   folderName: `results/claim-response-professional`,
// });
