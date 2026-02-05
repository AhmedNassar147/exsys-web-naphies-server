/*
 *
 * Helper: `mergeFilesToOnePdf`.
 *
 */
import { PDFDocument } from "pdf-lib";
import fixContentType, {
  NPHIES_SUPPORTED_IMAGE_EXTENSIONS,
} from "./fixContentType.mjs";
import isArrayHasData from "./isArrayHasData.mjs";
import getRemoteFilePathData from "./getRemoteFilePathData.mjs";
import compressPdfWithGhostscript from "./compressPdfWithGhostscript.mjs";

const { jpeg } = NPHIES_SUPPORTED_IMAGE_EXTENSIONS;

// 1- install Ghostscript https://ghostscript.com/releases/gsdnld.html
// 2- add C:\Program Files\gs\gs10.05.1\bin to your PATH environment variable
// 3- check gswin64c --version works in your terminal

const formatFiles = async (filesData) => {
  let parentPdfFileBytes;

  const promises = filesData.map(async ({ url, contentType }) => {
    if (!contentType || !url) {
      return false;
    }
    const { data: fileDate } = await getRemoteFilePathData(url, 0);

    if (!fileDate) {
      return false;
    }

    const fixedContentType = fixContentType(contentType) || "";

    const [firstType, fileType] = fixedContentType.split("/");

    if (firstType === "image") {
      const ImageType = NPHIES_SUPPORTED_IMAGE_EXTENSIONS[fileType] || jpeg;
      return {
        ImageType,
        fileDate,
      };
    }

    if (!parentPdfFileBytes) {
      parentPdfFileBytes = fileDate;

      return false;
    }

    return {
      fileDate,
    };
  });

  const data = (await Promise.all(promises)).filter(Boolean);

  return {
    parentPdfFileBytes,
    data,
  };
};

const mergeFilesToOnePdf = (filesData) =>
  new Promise(async (resolve) => {
    if (!isArrayHasData(filesData)) {
      return resolve({});
    }

    try {
      const { parentPdfFileBytes, data } = await formatFiles(filesData);

      const pdfDoc = parentPdfFileBytes
        ? await PDFDocument.load(parentPdfFileBytes)
        : await PDFDocument.create();

      for (const { ImageType, fileDate } of data) {
        if (!ImageType) {
          const fileDocument = await PDFDocument.load(fileDate);
          const copiedPages = await pdfDoc.copyPages(
            fileDocument,
            fileDocument.getPageIndices(),
          );
          for (const p of copiedPages) pdfDoc.addPage(p);
        } else {
          // If you also support PNG, switch embed method accordingly
          const image = await pdfDoc.embedJpg(fileDate);
          const page = pdfDoc.addPage();
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: page.getWidth(),
            height: page.getHeight(),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      let _pdfFileBytes = pdfBytes;

      try {
        _pdfFileBytes =
          (await compressPdfWithGhostscript(pdfBytes)) ?? pdfBytes;
      } catch (error) {
        console.log("compressPdfWithGhostscript error:", error.message);
      }

      return resolve({ pdfFileBytes: _pdfFileBytes });
    } catch (error) {
      let _error = error.message || "something wrong when merging the files";
      _error += `  ${filesData.map(({ url }) => url).join("---")}`;
      resolve({
        pdfFileError: _error,
      });
    }
  });

export default mergeFilesToOnePdf;

// const files = [
// {
//   url: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c21hbGx8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
//   contentType: "image/jpeg",
// },
//   {
//     url: "https://img.freepik.com/free-vector/opposite-adjectives-words-with-big-small_1308-56389.jpg",
//     contentType: "image/jpg",
//   },
// ];

// const files = [
//   {
//     url: "http://149.102.140.8:7778/reports/rwservlet?server=rep_server_FRHome1+DESTYPE=cache+report=D:\\\\ExsysReports\\\\PBALLRPT.rep+userid=EXSYS_API/EXSYS_API@149.102.140.8:1521/EXSYS+DESTYPE=cache+desformat=pdf+ENVID=EN+LANGUAGE_ID=1+P_EPISODE_INVOICE_NO=I00123/00273+P_EPISODE_NO=1+P_ORG_NO=001+P_PATIENT_FILE_NO=003320",
//     contentType: "application/pdf",
//   },
//   {
//     url: "http://149.102.140.8:7778/reports/rwservlet?server=rep_server_FRHome1+DESTYPE=cache+report=D:\\\\ExsysReports\\\\PBALLRPT.rep+userid=EXSYS_API/EXSYS_API@149.102.140.8:1521/EXSYS+DESTYPE=cache+desformat=pdf+ENVID=EN+LANGUAGE_ID=1+P_EPISODE_INVOICE_NO=I00123/00274+P_EPISODE_NO=2+P_ORG_NO=001+P_PATIENT_FILE_NO=003320",
//     contentType: "application/pdf",
//   },
// {
//   url: "http://149.102.140.8:7778/reports/rwservlet?server=rep_server_FRHome1+DESTYPE=cache+report=D:\\\\ExsysReports\\\\PBALLRPT.rep+userid=EXSYS_API/EXSYS_API@149.102.140.8:1521/EXSYS+DESTYPE=cache+desformat=pdf+ENVID=EN+LANGUAGE_ID=1+P_EPISODE_INVOICE_NO=I00123/00275+P_EPISODE_NO=1+P_ORG_NO=001+P_PATIENT_FILE_NO=032151",
//   contentType: "application/pdf",
// },
//   {
//     url: "http://149.102.140.8:7778/reports/rwservlet?server=rep_server_FRHome1+DESTYPE=cache+report=D:\\\\ExsysReports\\\\PBALLRPT.rep+userid=EXSYS_API/EXSYS_API@149.102.140.8:1521/EXSYS+DESTYPE=cache+desformat=pdf+ENVID=EN+LANGUAGE_ID=1+P_EPISODE_INVOICE_NO=I00123/00276+P_EPISODE_NO=1+P_ORG_NO=001+P_PATIENT_FILE_NO=032452",
//     contentType: "application/pdf",
//   },
// {
//   url: "http://149.102.140.8:7778/reports/rwservlet?server=rep_server_FRHome1+DESTYPE=cache+report=D:\\\\ExsysReports\\\\PBALLRPT.rep+userid=EXSYS_API/EXSYS_API@149.102.140.8:1521/EXSYS+DESTYPE=cache+desformat=pdf+ENVID=EN+LANGUAGE_ID=1+P_EPISODE_INVOICE_NO=I00123/00277+P_EPISODE_NO=1+P_ORG_NO=001+P_PATIENT_FILE_NO=043151",
//   contentType: "application/pdf",
// },
// ];

// const files = [
//   {
//     url: "https://img.freepik.com/free-vector/opposite-adjectives-words-with-big-small_1308-56389.jpg",
//     contentType: "image/jpg",
//   },
//   {
//     url: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c21hbGx8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
//     contentType: "image/jpeg",
//   },
// ];

// const { pdfFileBytes } = await mergeFilesToOnePdf(files);
