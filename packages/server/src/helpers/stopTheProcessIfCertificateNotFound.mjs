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
  isObjectHasData,
} from "@exsys-web-server/helpers";
import { getConfigFileData } from "./getConfigFileData.mjs";
import { CLI_CONFIG } from "../constants.mjs";

const { ignoreCert } = CLI_CONFIG;

const mapOrganizationsAndCheckCertificates = (
  organizations,
  rootYarnWorkSpaces
) => {
  const organizationsValues = Object.values(organizations);

  return organizationsValues.map(async ({ certificatePath }) => {
    const doesFileExist = await checkPathExists(
      `${rootYarnWorkSpaces}/${certificatePath}`
    );
    return !doesFileExist
      ? `${chalk.bold.white(certificatePath)} doesn't exist`
      : false;
  });
};

const stopTheProcessIfCertificateNotFound = async () => {
  if (ignoreCert) {
    createCmdMessage({
      type: "info",
      message: "skipping certificate checker ...",
    });

    return false;
  }

  createCmdMessage({
    type: "info",
    message: "checking certificate ...",
  });

  const rootYarnWorkSpaces = await findRootYarnWorkSpaces();

  const { clients } = await getConfigFileData();
  const clientValues = Object.values(clients);

  const configPromises = clientValues
    .reduce((acc, { organizations }) => {
      if (isObjectHasData(organizations)) {
        acc.push(
          ...mapOrganizationsAndCheckCertificates(
            organizations,
            rootYarnWorkSpaces
          )
        );
      }

      return acc;
    }, [])
    .flat()
    .filter(Boolean);

  const errors = await Promise.all(configPromises);

  if (errors.length) {
    errors.forEach((error) =>
      createCmdMessage({
        type: "error",
        message: error,
      })
    );
    // console.log(`restarting server after ${RESTART_SERVER_MS / 1000} seconds`);
    // restartProcess();

    return true;
  }

  return false;
};

export default stopTheProcessIfCertificateNotFound;
