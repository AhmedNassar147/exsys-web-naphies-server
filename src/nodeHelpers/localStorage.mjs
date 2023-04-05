/*
 *
 * Helper: `localStorage`.
 *
 */
import { writeFile } from "fs/promises";
import checkPathExists from "./checkPathExists.mjs";
import readJsonFile from "./readJsonFile.mjs";
import { PACKAGE_JSON_APP_CONFIG, localStoragePath } from "../constants.mjs";

const { localStorageFilePaths } = PACKAGE_JSON_APP_CONFIG;

const throwIfLocalStorageFilesDoesNotIncludeFilePath = (filePath) => {
  if (!localStorageFilePaths.includes(filePath)) {
    throw new Error(
      `the file \`${filePath}\` must be set in \`localStorageFilePaths\``
    );
  }
};

export const getLocalStorageItem = async ({ fileName = "", key }) => {
  const filePath = `${fileName}.json`;

  throwIfLocalStorageFilesDoesNotIncludeFilePath(filePath);
  const fileFullPath = `${localStoragePath}/${filePath}`;

  const isPathExists = await checkPathExists(fileFullPath);

  if (isPathExists) {
    const data = (await readJsonFile(fileFullPath, true)) || {};
    return key ? data[key] : data;
  }

  return {};
};

export const setLocalStorageItem = async ({ fileName = "", key, value }) => {
  const filePath = `${fileName}.json`;

  throwIfLocalStorageFilesDoesNotIncludeFilePath(filePath);
  const fileFullPath = `${localStoragePath}/${filePath}`;

  const isPathExists = await checkPathExists(fileFullPath);

  if (!isPathExists) {
    return undefined;
  }

  const data = await readJsonFile(fileFullPath, true);

  const newFileValue = {
    ...(data || null),
    [key]: value,
  };

  await writeFile(fileFullPath, JSON.stringify(newFileValue, null, 2));
};
