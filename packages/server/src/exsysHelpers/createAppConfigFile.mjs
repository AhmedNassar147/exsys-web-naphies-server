/*
 *
 * Helper: `createAppConfigFile`.
 *
 */
import { writeFile } from "fs/promises";
import { EXSYS_API_IDS_NAMES } from "../constants.mjs";
import { createCmdMessage } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import { getConfigFilePath } from "../helpers/getConfigFileData.mjs";

const { queryProgramOrganizations } = EXSYS_API_IDS_NAMES;

const createAppConfigFile = async () => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: queryProgramOrganizations,
    requestMethod: "GET",
  });

  if (!isSuccess) {
    createCmdMessage({
      type: "error",
      message: "can't initiate the program organizations",
      data: result,
    });

    process.kill(process.pid);
  }

  const configFilePath = await getConfigFilePath();

  await writeFile(configFilePath, JSON.stringify(result || {}, null, 2));
};

export default createAppConfigFile;
