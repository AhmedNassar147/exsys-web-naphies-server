/*
 *
 * Helper: `mergeFilesToOnePdf`.
 *
 */
import { readFile } from "fs/promises";
import { PDFDocument } from "pdf-lib";
import fixContentType, {
  NPHIES_SUPPORTED_IMAGE_EXTENSIONS,
} from "./fixContentType.mjs";
import isArrayHasData from "./isArrayHasData.mjs";
// import findRootYarnWorkSpaces from "./findRootYarnWorkSpaces.mjs";

const { jpeg } = NPHIES_SUPPORTED_IMAGE_EXTENSIONS;

const formatFiles = async (localFilesPath) => {
  let parentPdfFileBytes;

  const promises = localFilesPath.map(async ({ data, contentType }) => {
    if (!contentType || !data) {
      return false;
    }

    const fixedContentType = fixContentType(contentType) || "";

    const [firstType, fileType] = fixedContentType.split("/");
    const fileBytes = await readFile(data);

    if (firstType === "image") {
      const ImageType = NPHIES_SUPPORTED_IMAGE_EXTENSIONS[fileType] || jpeg;
      return {
        ImageType,
        fileBytes,
      };
    }

    if (!parentPdfFileBytes) {
      parentPdfFileBytes = fileBytes;

      return false;
    }

    return {
      fileBytes,
    };
  });

  const data = (await Promise.all(promises)).filter(Boolean);

  return {
    parentPdfFileBytes,
    data,
  };
};

const mergeFilesToOnePdf = async (localFilesPath) => {
  if (!isArrayHasData(localFilesPath)) {
    return undefined;
  }

  const { parentPdfFileBytes, data } = await formatFiles(localFilesPath);

  const pdfDoc = parentPdfFileBytes
    ? await PDFDocument.load(parentPdfFileBytes)
    : await PDFDocument.create();

  data.forEach(async ({ ImageType, fileBytes }) => {
    if (!ImageType) {
      const fileDocument = await PDFDocument.load(fileBytes);
      const copedFileDocument = await pdfDoc.copyPages(
        fileDocument,
        fileDocument.getPageIndices()
      );

      for (let index = 0; index < copedFileDocument.length; index++) {
        const currentDocumentPage = copedFileDocument[index];
        pdfDoc.addPage(currentDocumentPage);
      }
    } else {
      const image = await pdfDoc.embedJpg(fileBytes);
      const page = pdfDoc.addPage();

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
      });
    }
  });

  // const rootFilePath = await findRootYarnWorkSpaces();
  const pdfBytes = await pdfDoc.save();
  const base64Pdf = Buffer.from(pdfBytes).toString("base64");
  // const newFilePath = `${rootFilePath}/resultData.pdf`;
  // await writeFile(newFilePath, base64Pdf, "base64");

  return base64Pdf;
};

export default mergeFilesToOnePdf;

// const files = [
//   // {
//   //   data: "results/abc/Process_Link.pdf",
//   //   contentType: "application/pdf",
//   // },
//   // {
//   //   data: "results/abc/Process_Process.pdf",
//   //   contentType: "application/pdf",
//   // },
//   {
//     data: "results/abc/car.jpeg",
//     contentType: "image/jpeg",
//   },
//   {
//     data: "results/abc/car.jpeg",
//     contentType: "image/jpeg",
//   },
// ];

// await mergeFilesToOnePdf(files).catch(console.error);
