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
  formatReturnedResults,
}) => {
  if (isArrayHasData(dataArray)) {
    const configPromises = dataArray
      .map((item, index) => asyncFn(item, !index ? 0 : index + 2, index))
      .filter(Boolean)
      .flat();

    const results = await Promise.all(configPromises);

    const { printInfo, loggerValues, resultsData } =
      await createApiResultsAndLoggerValues(results);

    await createPrintResultsOrLog({
      printValues,
      printData: printInfo,
      loggerValues,
    });

    const finalResults = formatReturnedResults
      ? await formatReturnedResults({
          printInfo,
          loggerValues,
          resultsData,
        })
      : resultsData;

    return Promise.resolve(finalResults);
  }

  const finalResults = formatReturnedResults
    ? await formatReturnedResults({})
    : [];

  return Promise.resolve(finalResults);
};

export default createMappedRequestsArray;
