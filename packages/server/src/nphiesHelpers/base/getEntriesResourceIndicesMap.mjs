/*
 *
 * Helper: `getEntriesResourceIndicesMap`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";

const getEntriesResourceIndicesMap = (nodeServerDataSentToNphies) => {
  const { entry } = nodeServerDataSentToNphies || {};

  if (isArrayHasData(entry)) {
    return entry.reduce(
      (acc, { resource: { resourceType } }, index) => ({
        ...acc,
        [index]: resourceType,
      }),
      {}
    );
  }

  return {};
};

export default getEntriesResourceIndicesMap;
