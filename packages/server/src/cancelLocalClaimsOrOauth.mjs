/*
 *
 * Helper: `cancelLocalClaimsOrOauth`.
 *
 */
import {
  findRootYarnWorkSpaces,
  readJsonFile,
} from "@exsys-web-server/helpers";
import createMappedClaimOrPreauthCancellation from "./exsysHelpers/createMappedClaimOrPreauthCancellationOrStatusCheck.mjs";

const cancelLocalClaimsOrOauth = async (filePath) => {
  const rootPath = await findRootYarnWorkSpaces();
  const fullFilePath = `${rootPath}/${filePath}`;
  const claimsOrPreauthData = await readJsonFile(fullFilePath, true);

  await createMappedClaimOrPreauthCancellation({
    data: claimsOrPreauthData,
    authorization: 111111,
    printValues: true,
  });
};

const localFilePath = "";
await cancelLocalClaimsOrOauth(localFilePath);
