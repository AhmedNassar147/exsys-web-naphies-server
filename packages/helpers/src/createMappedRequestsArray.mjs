/*
 *
 * `createMappedRequestsArray`: `helper`
 *
 */
import isArrayHasData from "./isArrayHasData.mjs";
import createPrintResultsOrLog from "./createPrintResultsOrLog.mjs";

const initialReducerValue = {
  printData: {},
  loggerValues: [],
  resultsData: [],
};

const createMappedRequestsArray = async ({
  dataArray,
  asyncFn,
  printValues = true,
}) => {
  if (isArrayHasData(dataArray)) {
    const configPromises = dataArray.map(asyncFn);
    const results = await Promise.all(configPromises);

    const { printData, loggerValues, resultsData } = results.reduce(
      (acc, { printData, loggerValue, resultData }) => {
        const { folderName, isError, data } = printData | {};

        if (folderName && data) {
          acc.printData.folderName = folderName;
          acc.printData.data = acc.printData.data || [];
          acc.printData.data.push({
            isError,
            ...data,
          });
        }

        acc.loggerValues.push(loggerValue);
        acc.resultsData.push(resultData);

        return acc;
      },
      initialReducerValue
    );

    await createPrintResultsOrLog({
      printValues,
      printData,
      loggerValues,
    });

    return Promise.resolve(resultsData);
  }

  return Promise.resolve(undefined);
};

export default createMappedRequestsArray;
