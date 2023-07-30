/*
 *
 * `createMappedRequestsArray`: `helper`
 *
 */
import isArrayHasData from "./isArrayHasData.mjs";
import createPrintResultsOrLog from "./createPrintResultsOrLog.mjs";
import createApiResultsAndLoggerValues from "./createApiResultsAndLoggerValues.mjs";

const createMappedRequestsArray = async ({
  dataArray,
  asyncFn,
  printValues = true,
}) => {
  if (isArrayHasData(dataArray)) {
    const configPromises = dataArray.map(asyncFn).filter(Boolean).flat();

    const results = await Promise.all(configPromises);

    const { printInfo, loggerValues, resultsData } =
      await createApiResultsAndLoggerValues(results);

    await createPrintResultsOrLog({
      printValues,
      printData: printInfo,
      loggerValues,
    });

    return Promise.resolve(resultsData);
  }

  return Promise.resolve([]);
};

export default createMappedRequestsArray;
