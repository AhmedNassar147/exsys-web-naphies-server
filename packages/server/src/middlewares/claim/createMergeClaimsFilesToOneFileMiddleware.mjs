/*
 *
 * middleware: `createMergeClaimsFilesToOneFileMiddleware`.
 *
 */
import {
  isArrayHasData,
  mergeFilesToOnePdf,
  writeResultFile,
} from "@exsys-web-server/helpers";
import createMergeClaimsFilesToOneFileMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import uploadFileToExsys from "../../exsysHelpers/uploadFileToExsys.mjs";
import { EXSYS_API_IDS_NAMES } from "../../constants.mjs";

const { queryClaimsToCreatePdfFile } = EXSYS_API_IDS_NAMES;

const saveFileThenSaveRecordStatus = async (record) => {
  const {
    // patentFileNo,
    // episodeInvoiceNo,
    // organizationNo,
    // authorization,
    soaNo,
    pdfFileName,
    directoryName,
    pdfFileBytes,
  } = record;
  const results = await uploadFileToExsys({
    fileBinaryData: pdfFileBytes,
    fileName: pdfFileName,
    fileExtension: "pdf",
    directoryName,
    requestParams: {
      sub_dir: soaNo,
    },
  });

  return { [`${directoryName}-${soaNo}-${pdfFileName}`]: results };
};

export default createMergeClaimsFilesToOneFileMiddleware(async (body) => {
  const { authorization } = body;

  const { result, error } = await createExsysRequest({
    resourceName: queryClaimsToCreatePdfFile,
    requestMethod: "GET",
    requestParams: body,
  });

  const { data } = result || {};

  console.log("result.length", data.length);

  const hasData = isArrayHasData(data);
  const filteredData = data.filter(({ files }) => isArrayHasData(files));

  if (error || !hasData || !filteredData.length) {
    return {
      error: error || "files data empty",
    };
  }

  const clonedData = [...data];
  const failedMerge = [];
  const successededMerge = [];
  const claimsMergedAndUploadedToExsys = [];

  while (clonedData.length) {
    const [current] = clonedData.splice(0, 1);
    const { files, ...recordData } = current;
    const { pdfFileBytes } = await mergeFilesToOnePdf(files);

    if (!pdfFileBytes) {
      failedMerge.push(current);
    }

    if (pdfFileBytes) {
      successededMerge.push(current);
      const result = await saveFileThenSaveRecordStatus({
        authorization,
        pdfFileBytes,
        ...recordData,
      });

      claimsMergedAndUploadedToExsys.push(result);
    }
  }

  const hasFailedMerge = failedMerge.length;
  const successededMergeLength = successededMerge.length;

  await writeResultFile({
    data: {
      failedMerge,
      successededMerge,
      claimsMergedAndUploadedToExsys,
    },
    folderName: "NASSAR_PDF",
  });

  return {
    error: hasFailedMerge
      ? "there was an error while merging some files"
      : undefined,
    successededMergeCount: successededMergeLength,
  };
});
