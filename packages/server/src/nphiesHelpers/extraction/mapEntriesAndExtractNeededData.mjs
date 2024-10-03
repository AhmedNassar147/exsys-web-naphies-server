/*
 *
 * Helper: `mapEntriesAndExtractNeededData`.
 *
 */
import {
  findRootYarnWorkSpaces,
  isArrayHasData,
  readJsonFile,
  writeResultFile,
} from "@exsys-web-server/helpers";
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";
import extractPatientData from "./extractPatientData.mjs";
import extractCoverageData from "./extractCoverageData.mjs";
import extractLocationData from "./extractLocationData.mjs";
import extractMessageHeaderData from "./extractMessageHeaderData.mjs";
import extractOrganizationsData from "./extractOrganizationsData.mjs";
import extractEligibilityRequestData from "./extractEligibilityRequestData.mjs";
import extractEligibilityResponseData from "./extractEligibilityResponseData.mjs";
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
    Coverage: extractCoverageData,
  },
  [NPHIES_REQUEST_TYPES.PREAUTH]: {
    Coverage: extractCoverageData,
  },
};

const makeEntriesGroupByResourceType = (entries) => {
  const hasEntriesData = isArrayHasData(entries);

  if (hasEntriesData) {
    return entries.reduce((acc, entry) => {
      const {
        resource: { resourceType },
      } = entry;

      acc[resourceType] = acc[resourceType] || [];

      acc[resourceType].push(entry);

      return acc;
    }, {});
  }

  return false;
};

const createRunExtractionFunctions =
  (extractionFunctionsMap, mainRequestId) =>
  (groupedEntries, timestamp, isRequest) => {
    const keys = Object.keys(groupedEntries || {});

    if (keys.length && extractionFunctionsMap) {
      return keys.reduce(
        (acc, resourceType) => {
          const entryGroupArray = groupedEntries[resourceType];
          const extractionFn = extractionFunctionsMap[resourceType];

          if (extractionFn) {
            acc = {
              ...acc,
              ...extractionFn({ entryGroupArray, mainRequestId, isRequest }),
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

  const groupedNphiesResponseEntries = makeEntriesGroupByResourceType(entry);
  const groupedNphiesRequestEntries =
    makeEntriesGroupByResourceType(requestEntries);

  const shouldResultsToObjectOfData =
    !!groupedNphiesResponseEntries ||
    !!groupedNphiesRequestEntries ||
    !!issueValues;

  const extractionFunctionsMap = extractionFunctionsByRequestMap[requestType];

  const runExtractionFunctions = createRunExtractionFunctions(
    extractionFunctionsMap,
    mainRequestId
  );

  const nphiesResponseEntryResults = runExtractionFunctions(
    groupedNphiesResponseEntries,
    timestamp
  );

  const nphiesRequestEntryResults = runExtractionFunctions(
    groupedNphiesRequestEntries,
    requestTimestamp,
    true
  );

  const result = shouldResultsToObjectOfData
    ? {
        creationBundleId: mainRequestId,
        bundleId: id,
        ...issueValues,
        ...(nphiesResponseEntryResults || null),
        nphiesRequestExtractedData: nphiesRequestEntryResults,
        groupedNphiesResponseEntries,
        groupedNphiesRequestEntries,
      }
    : undefined;

  return result || defaultValue;
};

export default mapEntriesAndExtractNeededData;

const base = await findRootYarnWorkSpaces();
const [{ nodeServerDataSentToNaphies, nphiesResponse }] = await readJsonFile(
  `${base}/results/new-arc/elg-poll.json`,
  true
);

await writeResultFile({
  data: mapEntriesAndExtractNeededData({
    nodeServerDataSentToNaphies,
    nphiesResponse,
    requestType: NPHIES_REQUEST_TYPES.ELIGIBILITY,
  }),
  folderName: `new-arc/results/elg-poll`,
});
