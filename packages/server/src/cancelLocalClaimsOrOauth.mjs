/*
 *
 * Helper: `cancelLocalClaimsOrOauth`.
 *
 */
import { readJsonFile } from "@exsys-web-server/helpers";
import createMappedClaimOrPreauthCancellation from "./exsysHelpers/createMappedClaimOrPreauthCancellation.mjs";

const cancelLocalClaimsOrOauth = async (filePath) => {
  const claimsOrPreauthData = await readJsonFile(filePath, true);

  await createMappedClaimOrPreauthCancellation({
    data: claimsOrPreauthData,
    authorization: 111111,
    printValues: true,
  });
};

const localFilePath = "";
await cancelLocalClaimsOrOauth(localFilePath);
