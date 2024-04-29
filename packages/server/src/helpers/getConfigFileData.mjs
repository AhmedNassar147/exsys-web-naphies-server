/*
 *
 * Helper: `getOrganizationsData`;
 *
 */

import { readFile } from "fs/promises";
import chalk from "chalk";
import {
  createCmdMessage,
  findRootYarnWorkSpaces,
  readJsonFile,
} from "@exsys-web-server/helpers";
import buildOrganizationPath from "./buildOrganizationPath.mjs";
import { CLI_CONFIG } from "../constants.mjs";

const { ignoreCert } = CLI_CONFIG || {};

const getConfigFilePath = async () => {
  const rootYarnWorkSpaces = await findRootYarnWorkSpaces();

  return `${rootYarnWorkSpaces}/config.json`;
};

const getConfigFileData = async () => {
  const configFilePath = await getConfigFilePath();

  return await readJsonFile(configFilePath, true);
};

const getOrganizationsData = async (
  clientName,
  organizationOrOrganizationUnitPath
) => {
  const { clients } = await getConfigFileData();

  const clientData = clients[clientName];

  if (!clientName || !clientData) {
    createCmdMessage({
      type: "info",
      message: `the client ${chalk.bold.red(
        clientName
      )} is not found in database .`,
    });
  }

  const { organizations } = clientData;

  return organizationOrOrganizationUnitPath
    ? organizations[organizationOrOrganizationUnitPath]
    : organizations;
};

const getCertificateData = async (
  clientName,
  organizationNo,
  clinicalEntityNo
) => {
  const organizationOrOrganizationUnitPath = buildOrganizationPath(
    organizationNo,
    clinicalEntityNo
  );

  const { certificatePath, certificatePassphrase } =
    (await getOrganizationsData(
      clientName,
      organizationOrOrganizationUnitPath
    )) || {};

  if (!ignoreCert && (!certificatePath || !certificatePassphrase)) {
    createCmdMessage({
      type: "error",
      message: `the client=${clientName} certificate wasn't found in ${certificatePath}`,
    });

    return {
      passphrase: certificatePassphrase,
    };
  }

  if (ignoreCert) {
    return {
      passphrase: certificatePassphrase,
    };
  }

  const rootYarnWorkSpaces = await findRootYarnWorkSpaces();

  const certificate = await readFile(
    `${rootYarnWorkSpaces}/${certificatePath}`
  );

  return {
    passphrase: certificatePassphrase,
    certificate,
  };
};

export {
  getConfigFilePath,
  getConfigFileData,
  getOrganizationsData,
  getCertificateData,
};
