/*
 *
 * Helper: `getCurrentOrganizationDbUrl`.
 *
 */
import { createCmdMessage } from "@exsys-web-server/helpers";
import buildOrganizationPath from "./buildOrganizationPath.mjs";
import { getOrganizationsData } from "./getConfigFileData.mjs";

const getCurrentOrganizationDbUrl = async ({
  clientName,
  organizationNo,
  clinicalEntityNo,
  exsysQueryApiId,
  calledFromFnName,
}) => {
  const organizationOrOrganizationUnitPath = buildOrganizationPath(
    organizationNo,
    clinicalEntityNo
    // true
  );

  const { dbBaseUrl } = await getOrganizationsData(
    clientName,
    organizationOrOrganizationUnitPath
  );

  if (!dbBaseUrl || !clientName || !organizationNo) {
    createCmdMessage({
      type: "error",
      message: "organizationNo or clientName or dbBaseUrl not found",
      data: {
        fnName: calledFromFnName,
        exsysQueryApiId,
        organizationNo,
        clientName,
        clinicalEntityNo,
        dbBaseUrl,
      },
    });
  }

  return dbBaseUrl;
};

export default getCurrentOrganizationDbUrl;
