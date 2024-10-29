/*
 *
 * helper: `saveOldStructurePoll`.
 *
 */
import {
  findRootYarnWorkSpaces,
  readJsonFile,
} from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import { NPHIES_REQUEST_TYPES } from "../constants.mjs";
import mergePollBundlesAndSave from "./mergePollBundlesAndSave.mjs";

const oldStructureFileName = "newx.json";

const saveOldStructurePoll = async () => {
  const rootPath = await findRootYarnWorkSpaces();

  const filePath = `${rootPath}/results/${oldStructureFileName}`;

  const { nodeServerDataSentToNaphies, nphiesResponse } = await readJsonFile(
    filePath,
    true
  );

  const newExtractedData = mapEntriesAndExtractNeededData({
    nodeServerDataSentToNaphies,
    nphiesResponse,
    requestType: NPHIES_REQUEST_TYPES.POLL,
  });

  await mergePollBundlesAndSave({
    authorization: 111111,
    nodeServerDataSentToNaphies,
    nphiesResponse,
    nphiesExtractedData: newExtractedData,
  });
};

await saveOldStructurePoll();
