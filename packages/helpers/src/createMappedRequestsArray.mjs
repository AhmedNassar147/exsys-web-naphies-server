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

    const { printInfo, loggerValues, resultsData } = await Promise.resolve(
      results.reduce((acc, item) => {
        if (!isObjectHasData(item)) {
          console.log("LOG ITEM", item);
          return acc;
        }
        const { printData, loggerValue, resultData } = item;
        const { folderName, isError, data } = printData | {};
        console.log("printData", printData);

        if (folderName && data) {
          acc.printInfo.folderName = folderName;
          acc.printInfo.data = acc.printInfo.data || [];
          acc.printInfo.data.push({
            isError,
            ...data,
          });
        }

        if (loggerValue) {
          acc.loggerValues.push(loggerValue);
        }

        if (resultData) {
          acc.resultsData.push(resultData);
        }

        return acc;
      }, initialReducerValue)
    );

    await writeResultFile({
      data: {
        printValues,
        printData: printInfo,
        loggerValues,
      },
      folderName: "AHMED NASSER",
    });

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
