/*
 *
 * Helper: `writeResultFile`.
 *
 */

import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import {
  getCurrentDate,
  checkPathExists,
  readJsonFile,
  findRootYarnWorkSpaces,
} from "@exsys-web-server/helpers";

const writeResultFile = async ({ data, isError }) => {
  const { dateString, time } = getCurrentDate();

  const rootYarnWorkSpacePath = await findRootYarnWorkSpaces();
  const resultsFolderPath = `results/${isError ? "error" : "success"}`;
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
