/*
 *
 * Helper: `uploadFileToExsys`.
 *
 */
import FormData from "form-data";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES } from "../constants.mjs";

const { uploadExsysClaimFile: resourceName } = EXSYS_API_IDS_NAMES;

// sub_dir
const uploadFileToExsys = async ({
  fileBinaryData,
  fileName,
  fileExtension,
  directoryName,
  requestParams,
}) => {
  const fileNameWithExtension = `${fileName}.${fileExtension}`;

  const formData = new FormData();
  formData.append(fileName || "file", fileBinaryData, fileNameWithExtension);

  return await createExsysRequest({
    resourceName,
    body: formData,
    requestHeaders: { accept: "application/json", ...formData.getHeaders() },
    requestParams: {
      ...(requestParams || null),
      dir: directoryName,
      imageFileName: `\\${fileNameWithExtension}`,
    },
  });
};

export default uploadFileToExsys;
