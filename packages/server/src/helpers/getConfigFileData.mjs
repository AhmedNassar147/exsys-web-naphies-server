/*
 *
 * Helper: `getOrganizationsData`;
 *
 */

import { readFile } from "fs/promises";
import {
  findRootYarnWorkSpaces,
  readJsonFile,
} from "@exsys-web-server/helpers";
import buildOrganizationPath from "./buildOrganizationPath.mjs";
import { CLI_CONFIG } from "../constants.mjs";

const { ignoreCert } = CLI_CONFIG || {};

export const getConfigFilePath = async () => {
  const rootYarnWorkSpaces = await findRootYarnWorkSpaces();

  return `${rootYarnWorkSpaces}/config.json`;
};

export const getConfigFileData = async () => {
  const configFilePath = await getConfigFilePath();

  return await readJsonFile(configFilePath, true);
};

const getOrganizationsData = async (organizationOrOrganizationUnitPath) => {
  const { organizations } = await getConfigFileData();

  return organizationOrOrganizationUnitPath
    ? organizations[organizationOrOrganizationUnitPath]
    : organizations;
};

const getCertificateData = async (organizationNo, clinicalEntityNo) => {
  const organizationOrOrganizationUnitPath = buildOrganizationPath(
    organizationNo,
    clinicalEntityNo
  );

  const { certificatePath, certificatePassphrase } = await getOrganizationsData(
    organizationOrOrganizationUnitPath
  );

  if (ignoreCert) {
    return {
      passphrase: certificatePassphrase,
    };
  }

  const rootYarnWorkSpaces = await findRootYarnWorkSpaces();

  const certificate = await readFile(
    `${rootYarnWorkSpaces}/${certificatePath}`
  );

  if (!certificate) {
    throw new Error(`the certificate wasn't found in ${certificatePath}`);
  }

  return {
    passphrase: certificatePassphrase,
    certificate,
  };
};

export { getConfigFileData, getOrganizationsData, getCertificateData };
