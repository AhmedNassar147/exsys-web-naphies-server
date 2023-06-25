/*
 *
 * Helper: `mapEntriesAndExtractNeededData`.
 *
 */
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";

const mapEntriesAndExtractNeededData = (
  nphiesResponse,
  extractionFunctionsMap
) => {
  const { entry, id: bundle_id, issue } = nphiesResponse || {};
  const issueValues = formatNphiesResponseIssue(issue);

  const hasEntryData = !!(Array.isArray(entry) && entry.length);
  const shouldResultsToObjectOfData = hasEntryData || !!issueValues;
  let entryResults = null;

  if (hasEntryData && extractionFunctionsMap) {
    entryResults = [...entry].reduce((acc, { resource }) => {
      const { resourceType } = resource;
      const extractionFn = extractionFunctionsMap[resourceType];

      if (extractionFn) {
        acc[resourceType] = extractionFn(resource);
      }

      return acc;
    }, {});
  }

  return shouldResultsToObjectOfData
    ? {
        bundleId: bundle_id,
        ...(entryResults || null),
        ...issueValues,
      }
    : undefined;
};

export default mapEntriesAndExtractNeededData;
