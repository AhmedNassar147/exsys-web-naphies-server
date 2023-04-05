/*
 *
 * Helper: `createLocalStorageFolderFiles`.
 *
 */
import { mkdir, writeFile } from "fs/promises";
import checkPathExistsSync from "./checkPathExistsSync.mjs";
import { PACKAGE_JSON_APP_CONFIG, localStoragePath } from "../constants.mjs";

const createLocalStorageFolderFiles = async () => {
  const { localStorageFilePaths } = PACKAGE_JSON_APP_CONFIG;

  if (!localStorageFilePaths || !localStorageFilePaths.length) {
    throw new Error("localStorageFilePaths must contain at least one file");
  }

  const notFoundFiles = localStorageFilePaths
    .map((filePath) => `${localStoragePath}/${filePath}`)
    .filter(
      (localStorageFullPath) => !checkPathExistsSync(localStorageFullPath)
    );

  if (notFoundFiles.length) {
    if (!checkPathExistsSync(localStoragePath)) {
      await mkdir(localStoragePath);
    }

    const createLocalStorageFilesPromises = notFoundFiles.map(
      (localStorageFullPath) =>
        writeFile(localStorageFullPath, JSON.stringify({}))
    );

    await Promise.all(createLocalStorageFilesPromises);
  }
};

export default createLocalStorageFolderFiles;
