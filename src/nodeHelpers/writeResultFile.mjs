/*
 *
 * Helper: `writeResultFile`.
 *
 */
import { writeFile, mkdir } from "fs/promises";
import getCurrentDate from "./getCurrentDate.mjs";
import checkPathExists from "./checkPathExists.mjs";
import readJsonFile from "./readJsonFile.mjs";

const writeResultFile = async (data) => {
  const { dateString, time } = getCurrentDate();

  const currentResultFolderPath = "results";
  if (!(await checkPathExists(currentResultFolderPath))) {
    await mkdir(currentResultFolderPath);
  }

  const currentResultFilePath = `${currentResultFolderPath}/${dateString}.json`;

  let previousResultFileData = [];

  if (await checkPathExists(currentResultFilePath)) {
    previousResultFileData = await readJsonFile(currentResultFilePath, true);
  }

  const nextFileResults = [
    ...(Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          time,
        }))
      : [
          {
            time,
            ...data,
          },
        ]),
    ...(previousResultFileData || []),
  ];

  await writeFile(
    currentResultFilePath,
    JSON.stringify(nextFileResults, null, 2)
  );
};

export default writeResultFile;
