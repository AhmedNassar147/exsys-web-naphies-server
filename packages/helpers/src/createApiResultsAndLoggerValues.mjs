/*
 *
 * Helper: `createApiResultsAndLoggerValues`.
 *
 */

import isObjectHasData from "./isObjectHasData.mjs";

const createApiResultsAndLoggerValues = (results) =>
  Promise.resolve(
    results.reduce(
      (acc, item) => {
        if (!isObjectHasData(item)) {
          return acc;
        }
        const { printData, loggerValue, resultData } = item;
        const { folderName, data, ...others } = printData || {};

        if (folderName && data) {
          acc.printInfo.folderName = folderName;
          acc.printInfo.data = acc.printInfo.data || [];
          acc.printInfo.data.push({
            ...others,
            ...(data || null),
          });
        }

        if (loggerValue) {
          acc.loggerValues.push(loggerValue);
        }

        if (resultData) {
          acc.resultsData.push(resultData);
        }

        return acc;
      },
      {
        printInfo: {},
        loggerValues: [],
        resultsData: [],
      }
    )
  );

export default createApiResultsAndLoggerValues;
