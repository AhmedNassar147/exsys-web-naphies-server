/*
 *
 * Helper: `makeEntriesGroupByResourceType`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";

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

export default makeEntriesGroupByResourceType;
