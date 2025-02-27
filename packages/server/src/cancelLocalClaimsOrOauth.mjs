/*
 *
 * Helper: `cancelLocalClaimsOrOauth`.
 *
 */
import {
  delayProcess,
  findRootYarnWorkSpaces,
  isArrayHasData,
  readJsonFile,
  writeResultFile,
} from "@exsys-web-server/helpers";
import createMappedClaimOrPreauthCancellation from "./exsysHelpers/createMappedClaimOrPreauthCancellationOrStatusCheck.mjs";

const claimsToBeSentToNphiesPerRequestsMap = 5;

// node packages/server/src/cancelLocalClaimsOrOauth.mjs --production client=nameOfClient
const cancelLocalClaimsOrOauth = async (filePath) => {
  const rootPath = await findRootYarnWorkSpaces();
  const fullFilePath = `${rootPath}/${filePath}`;
  const { data: claims } = await readJsonFile(fullFilePath, true);

  let printInfoData = {};
  let results = [];

  while (claims.length) {
    const data = claims.splice(0, claimsToBeSentToNphiesPerRequestsMap);

    const { resultsData, printInfo } =
      await createMappedClaimOrPreauthCancellation({
        data: data.map((claim) => ({ ...claim, nullifyRequest: "Y" })),
        authorization: 111111,
        printValues: false,
        formatReturnedResults: ({ printInfo, resultsData }) => ({
          printInfo,
          resultsData,
        }),
      });

    if (isArrayHasData(resultsData)) {
      results = results.concat(...resultsData);
    }

    if (printInfo && isArrayHasData(printInfo.data)) {
      const { folderName, data } = printInfo;
      const folderData = printInfoData[folderName] || [];
      printInfoData[folderName] = folderData.concat(...data);
    }
  }

  const keys = Object.keys(printInfoData);

  while (keys.length) {
    const [folderName] = keys.splice(0, 1);
    const data = printInfoData[folderName];

    await writeResultFile({
      folderName: "MANUAL_CANCELLATION",
      data: data,
    });
  }
};

const localFilePath = "results/new 6.json";
await cancelLocalClaimsOrOauth(localFilePath);
