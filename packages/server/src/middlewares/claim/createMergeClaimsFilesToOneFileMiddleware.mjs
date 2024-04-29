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
import getCurrentOrganizationDbUrl from "../../helpers/getCurrentOrganizationDbUrl.mjs";

const { queryClaimsToCreatePdfFile, saveCreatedClaimPdfStatus } =
  EXSYS_API_IDS_NAMES;

const saveFileThenSaveRecordStatus = async ({
  clientName,
  dbBaseUrl,
  ...record
}) => {
  const {
    patentFileNo,
    episodeInvoiceNo,
    organizationNo,
    authorization,
    soaNo,
    pdfFileName,
    directoryName,
    pdfFileBytes,
    clinicalEntityNo,
  } = record;

  const { isSuccess: isFileUploaded } = await uploadFileToExsys({
    fileBinaryData: pdfFileBytes,
    fileName: pdfFileName,
    fileExtension: "pdf",
    dbBaseUrl,
    directoryName,
    requestParams: {
      authorization,
      sub_dir: soaNo,
    },
  });

  if (isFileUploaded) {
    const { isSuccess: isClaimCreatedPdfStatusUpdated } =
      await createExsysRequest({
        xBaseApiUrl: dbBaseUrl,
        resourceName: saveCreatedClaimPdfStatus,
        body: {
          authorization,
          patentFileNo,
          episodeInvoiceNo,
          organizationNo,
          clinicalEntityNo,
        },
        retryTimes: 0,
        retryDelay: 0,
      });

    return { isFileUploaded, isClaimCreatedPdfStatusUpdated };
  }

  return { isFileUploaded };
};

export default createMergeClaimsFilesToOneFileMiddleware(async (body) => {
  const { authorization, clientName, organization_no, clinicalEntityNo } = body;

  const dbBaseUrl = await getCurrentOrganizationDbUrl({
    clientName,
    organizationNo: organization_no,
    clinicalEntityNo,
    exsysQueryApiId: queryClaimsToCreatePdfFile,
    calledFromFnName: "createMergeClaimsFilesToOneFileMiddleware",
  });

  const { result, error } = await createExsysRequest({
    xBaseApiUrl: dbBaseUrl,
    resourceName: queryClaimsToCreatePdfFile,
    requestMethod: "GET",
    requestParams: body,
  });

  const { data } = result || {};
  const _data = data || [];

  const hasData = isArrayHasData(_data);
  const filteredData = _data.filter(
    (item) => !!item && isArrayHasData(item.files)
  );
  const totalOriginalClaims = _data.length;
  const totalProcessedClaims = filteredData.length;

  if (error || !hasData || !totalProcessedClaims) {
    return {
      error: error || "Files data is empty",
      totalProcessedClaims: 0,
      totalFailedMergedClaimsPdfFiles: 0,
      totalSuccessededMergedClaimsPdfFiles: 0,
      totalFailedUploadedClaimsPdfFile: 0,
      totalSuccessededUploadedClaimsPdfFile: 0,
      totalFailedUpdatedClaimsPdfFileStatus: 0,
      totalSuccessededUpdatedClaimsPdfFileStatus: 0,
    };
  }

  const clonedData = [...filteredData];
  let totalFailedMergedClaimsPdfFiles = 0;
  let totalSuccessededMergedClaimsPdfFiles = 0;

  let totalFailedUploadedClaimsPdfFile = 0;
  let totalSuccessededUploadedClaimsPdfFile = 0;

  let totalFailedUpdatedClaimsPdfFileStatus = 0;
  let totalSuccessededUpdatedClaimsPdfFileStatus = 0;

  let mergeFileError;

  while (clonedData.length) {
    const [current] = clonedData.splice(0, 1);
    const { files, ...recordData } = current;
    const { pdfFileBytes, pdfFileError } = await mergeFilesToOnePdf(files);

    if (!pdfFileBytes) {
      totalFailedMergedClaimsPdfFiles += 1;
      mergeFileError = pdfFileError;
    }

    if (pdfFileBytes) {
      totalSuccessededMergedClaimsPdfFiles += 1;

      const { isFileUploaded, isClaimCreatedPdfStatusUpdated } =
        await saveFileThenSaveRecordStatus({
          authorization,
          pdfFileBytes,
          ...recordData,
          clientName,
          dbBaseUrl,
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

  const totalSkippedClaims = totalOriginalClaims - totalProcessedClaims;

  return {
    error: mergeFileError,
    totalOriginalClaims,
    totalProcessedClaims,
    totalSkippedClaims,
    totalFailedMergedClaimsPdfFiles,
    totalSuccessededMergedClaimsPdfFiles,
    totalFailedUploadedClaimsPdfFile,
    totalSuccessededUploadedClaimsPdfFile,
    totalFailedUpdatedClaimsPdfFileStatus,
    totalSuccessededUpdatedClaimsPdfFileStatus,
  };
});
