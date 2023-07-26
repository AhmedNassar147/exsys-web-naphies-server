/*
 *
 * `createMappedRequestsArray`: `helper`
 *
 */
import isArrayHasData from "./isArrayHasData.mjs";
import createPrintResultsOrLog from "./createPrintResultsOrLog.mjs";
import delayProcess from "./delayProcess.mjs";
import isObjectHasData from "./isObjectHasData.mjs";

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
    const length = dataArray.length;

    const configPromises = dataArray
      .map((item, index) => [
        asyncFn(item, index),
        index < length - 1 ? delayProcess(2000) : false,
      ])
      .filter(Boolean)
      .flat();

    const results = await Promise.all(configPromises);

    const { printData, loggerValues, resultsData } = results.reduce(
      (acc, item) => {
        if (!isObjectHasData(item)) {
          console.log("LOG ITEM", item);
          return acc;
        }
        const { printData, loggerValue, resultData } = item;
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

  return Promise.resolve([]);
};

export default createMappedRequestsArray;
