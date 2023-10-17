/*
 *
 * middleware: `createMergeClaimsFilesToOneFileMiddleware`.
 *
 */
import {
  delayProcess,
  isArrayHasData,
  mergeFilesToOnePdf,
} from "@exsys-web-server/helpers";
import createMergeClaimsFilesToOneFileMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import uploadFileToExsys from "../../exsysHelpers/uploadFileToExsys.mjs";
import { EXSYS_API_IDS_NAMES } from "../../constants.mjs";

const { queryClaimsToCreatePdfFile, saveCreatedClaimPdfStatus } =
  EXSYS_API_IDS_NAMES;

const saveFileThenSaveRecordStatus = async (record) => {
  const {
    patentFileNo,
    episodeInvoiceNo,
    organizationNo,
    authorization,
    soaNo,
    pdfFileName,
    directoryName,
    pdfFileBytes,
  } = record;

  const { isSuccess: isFileUploaded } = await uploadFileToExsys({
    fileBinaryData: pdfFileBytes,
    fileName: pdfFileName,
    fileExtension: "pdf",
    directoryName,
    requestParams: {
      authorization,
      sub_dir: soaNo,
    },
  });

  if (isFileUploaded) {
    const { isSuccess: isClaimCreatedPdfStatusUpdated } =
      await createExsysRequest({
        resourceName: saveCreatedClaimPdfStatus,
        body: {
          authorization,
          patentFileNo,
          episodeInvoiceNo,
          organizationNo,
        },
        retryTimes: 0,
        retryDelay: 0,
      });

    return { isFileUploaded, isClaimCreatedPdfStatusUpdated };
  }

  return { isFileUploaded };
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
  const filteredData = data.filter((item) => isArrayHasData(item.files));
  const totalProcessedClaims = filteredData.length;

  if (error || !hasData || !totalProcessedClaims) {
    return {
      error: error || "Files data is empty",
    };
  }

  const clonedData = [...filteredData];
  let totalFailedMergedClaimsPdfFiles = 0;
  let totalSuccessededMergedClaimsPdfFiles = 0;

  let totalFailedUploadedClaimsPdfFile = 0;
  let totalSuccessededUploadedClaimsPdfFile = 0;

  let totalFailedUpdatedClaimsPdfFileStatus = 0;
  let totalSuccessededUpdatedClaimsPdfFileStatus = 0;

  while (clonedData.length) {
    const [current] = clonedData.splice(0, 1);
    const { files, ...recordData } = current;
    const { pdfFileBytes } = await mergeFilesToOnePdf(files);

    if (!pdfFileBytes) {
      totalFailedMergedClaimsPdfFiles += 1;
    }

    if (pdfFileBytes) {
      totalSuccessededMergedClaimsPdfFiles += 1;

      const { isFileUploaded, isClaimCreatedPdfStatusUpdated } =
        await saveFileThenSaveRecordStatus({
          authorization,
          pdfFileBytes,
          ...recordData,
        });

      if (isFileUploaded) {
        totalSuccessededUploadedClaimsPdfFile += 1;
      } else {
        totalFailedUploadedClaimsPdfFile = +1;
      }

      if (isClaimCreatedPdfStatusUpdated) {
        totalSuccessededUpdatedClaimsPdfFileStatus += 1;
      } else {
        totalFailedUpdatedClaimsPdfFileStatus += 1;
      }

      await delayProcess(50);
    }
  }

  return {
    totalProcessedClaims,
    totalFailedMergedClaimsPdfFiles,
    totalSuccessededMergedClaimsPdfFiles,
    totalFailedUploadedClaimsPdfFile,
    totalSuccessededUploadedClaimsPdfFile,
    totalFailedUpdatedClaimsPdfFileStatus,
    totalSuccessededUpdatedClaimsPdfFileStatus,
  };
});
