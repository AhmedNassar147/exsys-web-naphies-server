/*
 *
 * middleware: `createMergeClaimsFilesToOneFileMiddleware`.
 *
 */
import {
  delayProcess,
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
    authorization,
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
      authorization,
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

  const hasData = isArrayHasData(data);
  const filteredData = data.filter(({ files }) => isArrayHasData(files));

  if (error || !hasData || !filteredData.length) {
    return {
      error: error || "files data empty",
    };
  }

  const clonedData = [...filteredData];
  let failedMergeCount = 0;
  let successededMergeCount = 0;
  let claimsMergedAndUploadedToExsys = [];

  while (clonedData.length) {
    const [current] = clonedData.splice(0, 1);
    const { files, ...recordData } = current;
    const { pdfFileBytes } = await mergeFilesToOnePdf(files);

    if (!pdfFileBytes) {
      failedMergeCount += 1;
    }

    if (pdfFileBytes) {
      successededMergeCount += 1;
      const result = await saveFileThenSaveRecordStatus({
        authorization,
        pdfFileBytes,
        ...recordData,
      });

      claimsMergedAndUploadedToExsys.push(result);
      await delayProcess(120);
    }
  }

  await writeResultFile({
    data: {
      failedMergeCount,
      successededMergeCount,
      claimsMergedAndUploadedToExsys,
    },
    folderName: "NASSAR_PDF",
  });

  return {
    error: failedMergeCount
      ? "there was an error while merging some files"
      : undefined,
    successededMergeCount,
  };
});
