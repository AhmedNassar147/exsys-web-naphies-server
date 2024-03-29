/*
 *
 * Helper: `mapEntriesAndExtractNeededData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";

const mapEntriesAndExtractNeededData = ({
  nphiesResponse,
  extractionFunctionsMap,
  creationBundleId,
  defaultValue,
}) => {
  const { entry, id, issue } = nphiesResponse || {};
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
          ...extractionFn({ resource, creationBundleId }),
        };
      }

      return acc;
    }, {});
  }

  const result = shouldResultsToObjectOfData
    ? {
        bundleId: id,
        creationBundleId,
        ...issueValues,
        ...(entryResults || null),
      }
    : undefined;

  return result || defaultValue;
};

export default mapEntriesAndExtractNeededData;
