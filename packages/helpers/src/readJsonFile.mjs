/*
 *
 * Helper: `readJsonFile`.
 *
 */
import { readFile } from "fs/promises";

const readJsonFile = async (jsonFilePath, parse) => {
  const jsonFileData = await readFile(jsonFilePath, {
    encoding: "utf8",
  });

  return new Promise((resolve) =>
    resolve(parse && jsonFileData ? JSON.parse(jsonFileData) : jsonFileData)
  );
};

export default readJsonFile;
