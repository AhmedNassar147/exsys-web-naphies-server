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

import { CLI_CONFIG } from "../constants.mjs";

const { ignoreCert } = CLI_CONFIG || {};

const getConfigFileData = async () => {
  const rootYarnWorkSpaces = await findRootYarnWorkSpaces();
  const config = await readJsonFile(`${rootYarnWorkSpaces}/config.json`, true);

  return config;
};

const getOrganizationsData = async (organizationNo) => {
  const { organizations } = await getConfigFileData();

  return organizationNo ? organizations[organizationNo] : organizations;
};

const getCertificateData = async (organizationNo) => {
  if (!organizationNo) {
    throw new Error("organizationNo wasn't provided to getCertificateData");
  }

  const { certificatePath, certificatePassphrase } = await getOrganizationsData(
    organizationNo
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

  return {
    passphrase: certificatePassphrase,
    certificate,
  };
};

export { getConfigFileData, getOrganizationsData, getCertificateData };
