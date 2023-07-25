/*
 *
 * Helper: `writeResultFile`.
 *
 */

import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import getCurrentDate from "./getCurrentDate.mjs";
import checkPathExists from "./checkPathExists.mjs";
import readJsonFile from "./readJsonFile.mjs";
import findRootYarnWorkSpaces from "./findRootYarnWorkSpaces.mjs";

const writeResultFile = async ({ data, folderName }) => {
  const { dateString, time } = getCurrentDate();

  const rootYarnWorkSpacePath = await findRootYarnWorkSpaces();
  const resultsFolderPath = `results/${folderName}`;
  const finalResultsFolderPath = join(rootYarnWorkSpacePath, resultsFolderPath);

  if (!(await checkPathExists(finalResultsFolderPath))) {
    await mkdir(finalResultsFolderPath, { recursive: true });
  }

  const currentResultFilePath = `${finalResultsFolderPath}/${dateString}.json`;

  let previousResultFileData = [];

  if (await checkPathExists(currentResultFilePath)) {
    previousResultFileData = await readJsonFile(currentResultFilePath, true);
  }

  const nextFileResults = [
    ...(Array.isArray(data)
      ? data.map((item) => ({
          time,
          ...item,
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
