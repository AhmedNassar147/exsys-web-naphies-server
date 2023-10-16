/*
 *
 * middleware: `createMergeClaimsFilesToOneFileMiddleware`.
 *
 */
import { isArrayHasData, mergeFilesToOnePdf } from "@exsys-web-server/helpers";
import createMergeClaimsFilesToOneFileMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import uploadFileToExsys from "../../exsysHelpers/uploadFileToExsys.mjs";
import { EXSYS_API_IDS_NAMES } from "../../constants.mjs";

const { queryClaimsToCreatePdfFile } = EXSYS_API_IDS_NAMES;

const saveFileThenSaveRecordStatus = async ({
  // patentFileNo,
  // episodeInvoiceNo,
  // organizationNo,
  // authorization,
  soaNo,
  pdfFileName,
  directoryName,
  pdfFileBytes,
}) => {
  const results = await uploadFileToExsys({
    fileBinaryData: pdfFileBytes,
    fileName: pdfFileName,
    fileExtension: "pdf",
    directoryName,
    requestParams: {
      sub_dir: soaNo,
    },
  });

  console.log("results", results);

  return results;
};

export default createMergeClaimsFilesToOneFileMiddleware(async (body) => {
  const { authorization } = body;

  const { result, error } = await createExsysRequest({
    resourceName: queryClaimsToCreatePdfFile,
    requestMethod: "GET",
    requestParams: body,
  });

  const { data } = result || {};

  console.log("result", result);

  const hasData = isArrayHasData(data);
  const filteredData = data.filter(({ files }) => isArrayHasData(files));

  if (error || !hasData || !filteredData.length) {
    return {
      error: error || "files data empty",
    };
  }

  const filteredDataWithFileBytesPromises = data.map(
    async ({ files, ...recordData }) => {
      const { pdfFileBytes, pdfFileError } = await mergeFilesToOnePdf(files);

      return {
        ...recordData,
        pdfFileBytes,
        pdfFileError,
      };
    }
  );

  const filteredDataWithFileBytes = await Promise.all(
    filteredDataWithFileBytesPromises
  );

  const { failedMerge, successededMerge } = filteredDataWithFileBytes.reduce(
    (acc, current) => {
      const { pdfFileBytes } = current;

      if (pdfFileBytes) {
        acc.successededMerge.push(current);
      }

      if (!pdfFileBytes) {
        acc.failedMerge.push(current);
      }
    },
    {
      failedMerge: [],
      successededMerge: [],
    }
  );

  const hasFailedMerge = failedMerge.length;
  const successededMergeLength = successededMerge.length;

  if (successededMergeLength) {
    const updatedRecordsWithExsysPromises = successededMerge.map(
      async (record) =>
        await saveFileThenSaveRecordStatus({ authorization, ...record })
    );

    await Promise.all(updatedRecordsWithExsysPromises);
  }

  return {
    error: hasFailedMerge
      ? "there was an error while merging some files"
      : undefined,
    successededMergeCount: successededMergeLength,
  };
});
