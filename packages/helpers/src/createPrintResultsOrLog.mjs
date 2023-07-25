/*
 *
 * Helper: `createPrintResultsOrLog`.
 *
 */
import createCmdMessage from "./createCmdMessage.mjs";
import isArrayHasData from "./isArrayHasData.mjs";
import writeResultFile from "./writeResultFile.mjs";

const createPrintResultsOrLog = async ({
  printValues,
  printData,
  loggerValues,
}) => {
  if (printValues && printValues.folderName) {
    await writeResultFile(printData);
    return;
  }

  if (isArrayHasData(loggerValues)) {
    loggerValues.forEach((loggerValue) =>
      createCmdMessage({
        type: "error",
        message: loggerValue,
      })
    );
  }
};

export default createPrintResultsOrLog;
