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

  if (Array.isArray(entry) && entry.length && extractionFunctionsMap) {
    const result = [...entry].reduce((acc, { resource }) => {
      const { resourceType } = resource;
      const extractionFn = extractionFunctionsMap[resourceType];

      if (extractionFn) {
        acc[resourceType] = extractionFn(resource);
      }

      return acc;
    }, {});

    return {
      bundleId: bundle_id,
      ...(result || null),
      ...issueValues,
    };
  }

  return !!issueValues ? issueValues : undefined;
};

export default mapEntriesAndExtractNeededData;
