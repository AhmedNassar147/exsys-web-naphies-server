/*
 *
 * Helper: `convertFileUrlToBase64`.
 *
 */
import chalk from "chalk";
import {
  createCmdMessage,
  getRemoteFilePathData,
} from "@exsys-web-server/helpers";

const convertFileUrlToBase64 = async (fileUrl) => {
  const result = await getRemoteFilePathData(fileUrl, 5);

  const { skip, sizeMb } = result;

  if (skip) {
    createCmdMessage({
      type: "info",
      message: `skipping ${chalk.white.bold(
        fileUrl
      )} because size is ${chalk.red.bold(`${sizeMb} MB`)}`,
    });
  }

  return result;
};

export default convertFileUrlToBase64;
