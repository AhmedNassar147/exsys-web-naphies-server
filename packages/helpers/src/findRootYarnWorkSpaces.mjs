/*
 *
 * Helper: `findRootYarnWorkSpaces`.
 *
 */
import { normalize, join, dirname } from "path";
import readJsonFile from "./readJsonFile.mjs";
import checkPathExists from "./checkPathExists.mjs";

const extractWorkspaces = (manifest) => {
  const workspaces = (manifest || {}).workspaces;
  return Array.isArray(workspaces) ? workspaces : false;
};

const readPackageJSON = async (dir) => {
  const file = join(dir, "package.json");

  if (await checkPathExists(file)) {
    return await readJsonFile(file, true);
  }

  return null;
};

const findRootYarnWorkSpaces = async (initial, maxReties) => {
  if (!initial) {
    initial = dirname(import.meta.url).replace(/^file:\/\/\//, "");
  }

  initial = normalize(initial);

  const maximumRetries = maxReties || 100;

  let result = "";
  let tries = 0;

  do {
    const manifest = await readPackageJSON(initial);
    const workspaces = extractWorkspaces(manifest);

    if (workspaces) {
      result = initial;
      break;
    } else {
      initial = join(initial, "..");
      ++tries;
    }
  } while (tries < maximumRetries);

  return result;
};

export default findRootYarnWorkSpaces;
