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
    const configFunctionPromises = dataArray
      .map(
        (item, index) => async () =>
          await asyncFn(item, (!index ? 0 : index) * 4000, index)
      )
      .filter(Boolean)
      .flat();

    let results = [];
    let shouldBreakLoop = false;

    while (configFunctionPromises.length && !shouldBreakLoop) {
      const [fnThatReturnsPromise] = configFunctionPromises.splice(0, 1);
      const result = await fnThatReturnsPromise();
      results = results.concat(result);

      const { resultData } = result;
      const { isNphiesServerNotConnected } = resultData;

      if (isNphiesServerNotConnected) {
        shouldBreakLoop = true;
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
