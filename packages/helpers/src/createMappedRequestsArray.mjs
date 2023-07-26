/*
 *
 * `createMappedRequestsArray`: `helper`
 *
 */
import isArrayHasData from "./isArrayHasData.mjs";
import createPrintResultsOrLog from "./createPrintResultsOrLog.mjs";
import isObjectHasData from "./isObjectHasData.mjs";
import writeResultFile from "./writeResultFile.mjs";

const initialReducerValue = {
  printInfo: {},
  loggerValues: [],
  resultsData: [],
};

const createMappedRequestsArray = async ({
  dataArray,
  asyncFn,
  printValues = true,
}) => {
  if (isArrayHasData(dataArray)) {
    const configPromises = dataArray.map(asyncFn).filter(Boolean).flat();

    const results = await Promise.all(configPromises);

    await writeResultFile({
      data: results,
      folderName: "AHMED NASSER",
    });

    const { printInfo, loggerValues, resultsData } = results.reduce(
      (acc, item) => {
        if (!isObjectHasData(item)) {
          console.log("LOG ITEM", item);
          return acc;
        }
        const { printData, loggerValue, resultData } = item;
        const { folderName, isError, data } = printData | {};

        if (folderName && data) {
          acc.printInfo.folderName = folderName;
          acc.printInfo.data = acc.printInfo.data || [];
          acc.printInfo.data.push({
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
      printData: printInfo,
      loggerValues,
    });

    return Promise.resolve(resultsData);
  }

  return Promise.resolve([]);
};

export default createMappedRequestsArray;
