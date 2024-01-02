/*
 *
 * Helper: `stopTheProcessIfCertificateNotFound`.
 *
 */
import chalk from "chalk";
import {
  checkPathExists,
  createCmdMessage,
  findRootYarnWorkSpaces,
} from "@exsys-web-server/helpers";
import { getOrganizationsData } from "./getConfigFileData.mjs";
import { CLI_CONFIG } from "../constants.mjs";

const { ignoreCert } = CLI_CONFIG;

const stopTheProcessIfCertificateNotFound = async (showCheckingLog = true) => {
  if (ignoreCert) {
    createCmdMessage({
      type: "info",
      message: "skipping certificate checker ...",
    });

    return;
  }

  if (showCheckingLog) {
    createCmdMessage({
      type: "info",
      message: "checking certificate ...",
    });
  }

  const organizations = await getOrganizationsData();

  const values = Object.values(organizations);

  const rootYarnWorkSpaces = await findRootYarnWorkSpaces();

  const configPromises = values.map(async ({ certificatePath }) => {
    const doesFileExsist = await checkPathExists(
      `${rootYarnWorkSpaces}/${certificatePath}`
    );
    return !doesFileExsist
      ? `${chalk.bold.white(certificatePath)} doesn't exist`
      : false;
  });

  const errors = (await Promise.all(configPromises)).filter(Boolean);

  if (errors.length) {
    errors.forEach((error) =>
      createCmdMessage({
        type: "error",
        message: error,
      })
    );
    // console.log(`restarting server after ${RESTART_SERVER_MS / 1000} seconds`);
    // restartProcess();
    process.kill(process.pid);
  }
};

export default stopTheProcessIfCertificateNotFound;
