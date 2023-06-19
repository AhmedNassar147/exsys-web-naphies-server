/*
 *
 * Helper: `mapEntriesAndExtractNeededData`.
 *
 */
const mapEntriesAndExtractNeededData = (
  nphiesResponse,
  extractionFunctionsMap
) => {
  const { entry, id: bundle_id } = nphiesResponse || {};
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
    };
  }

  return undefined;
};

export default mapEntriesAndExtractNeededData;
