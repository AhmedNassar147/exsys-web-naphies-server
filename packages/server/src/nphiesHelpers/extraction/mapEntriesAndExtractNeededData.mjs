/*
 *
 * Helper: `mapEntriesAndExtractNeededData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";

const mapEntriesAndExtractNeededData = (
  nphiesResponse,
  extractionFunctionsMap
) => {
  const { entry, id: bundle_id, issue } = nphiesResponse || {};
  const issueValues = formatNphiesResponseIssue(issue);

  const hasEntryData = isArrayHasData(entry);
  const shouldResultsToObjectOfData = hasEntryData || !!issueValues;
  let entryResults = null;

  if (hasEntryData && extractionFunctionsMap) {
    entryResults = [...entry].reduce((acc, { resource }) => {
      const { resourceType } = resource;
      const extractionFn = extractionFunctionsMap[resourceType];

      if (extractionFn) {
        acc = {
          ...acc,
          ...extractionFn(resource),
        };
      }

      return acc;
    }, {});
  }

  return shouldResultsToObjectOfData
    ? {
        bundleId: bundle_id,
        ...issueValues,
        ...(entryResults || null),
      }
    : undefined;
};

export default mapEntriesAndExtractNeededData;
