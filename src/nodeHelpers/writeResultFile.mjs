/*
 *
 * Helper: `writeResultFile`.
 *
 */
import { writeFile, mkdir } from "fs/promises";
import getCurrentDate from "./getCurrentDate.mjs";
import checkPathExists from "./checkPathExists.mjs";
import readJsonFile from "./readJsonFile.mjs";

const writeResultFile = async ({ data, isError }) => {
  const { dateString, time } = getCurrentDate();

  const currentResultFolderPath = `results/${isError ? "error" : "success"}`;
  if (!(await checkPathExists(currentResultFolderPath))) {
    await mkdir(currentResultFolderPath, { recursive: true });
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
