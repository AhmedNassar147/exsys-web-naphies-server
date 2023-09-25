/*
 *
 * `createMappedRequestsArray`: `helper`
 *
 */
import isArrayHasData from "./isArrayHasData.mjs";
import createPrintResultsOrLog from "./createPrintResultsOrLog.mjs";
import createApiResultsAndLoggerValues from "./createApiResultsAndLoggerValues.mjs";
import delayProcess from "./delayProcess.mjs";

const createMappedRequestsArray = async ({
  dataArray,
  asyncFn,
  printValues = true,
  formatReturnedResults,
}) => {
  if (isArrayHasData(dataArray)) {
    let results = [];

    const clonedData = [...dataArray];

    while (clonedData.length) {
      const [itemData] = clonedData.splice(0, 1);
      const result = await asyncFn(itemData);
      results = results.concat(result);

      const { resultData } = result;
      const { isNphiesServerNotConnected } = resultData;

      if (isNphiesServerNotConnected) {
        await delayProcess(6000);
      }
    }

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
