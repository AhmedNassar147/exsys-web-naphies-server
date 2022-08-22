/*
 *
 * Helper: `getRootPackageJsonFile`.
 *
 */
import readJsonFile from "./readJsonFile.mjs";

const getRootPackageJsonFile = async () =>
  await readJsonFile(`<rootDir>/package.json`, true);

export default getRootPackageJsonFile;
