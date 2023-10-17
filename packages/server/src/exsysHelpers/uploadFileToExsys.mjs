/*
 *
 * Helper: `uploadFileToExsys`.
 *
 */
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES } from "../constants.mjs";

const { uploadExsysClaimFile: resourceName } = EXSYS_API_IDS_NAMES;

const uploadFileToExsys = async ({
  fileBinaryData,
  fileName,
  fileExtension,
  directoryName,
  requestParams,
}) =>
  await createExsysRequest({
    // xBaseApiUrl: "http://149.102.140.8:9090/ords/exsys_api",
    resourceName,
    body: fileBinaryData,
    retryTimes: 0,
    retryDelay: 0,
    requestHeaders: {
      "Content-type": "application/json",
    },
    requestParams: {
      ...(requestParams || null),
      dir: directoryName,
      imageFileName: `${fileName}.${fileExtension}`,
    },
  });

export default uploadFileToExsys;
