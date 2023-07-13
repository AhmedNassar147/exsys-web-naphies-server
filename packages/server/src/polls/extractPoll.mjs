/*
 *
 * extractPoll: `polls`.
 *
 */
import { basename } from "path";
import {
  writeResultFile,
  readJsonFile,
  checkPathExists,
} from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import { NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
  Bundle: (nphiesResponse) =>
    mapEntriesAndExtractNeededData(nphiesResponse, {
      [COVERAGE]: extractCoverageEntryResponseData,
      ClaimResponse: extractClaimResponseData,
    }),
};

const extractPoll = async (filePath) => {
  if (!(await checkPathExists(filePath))) {
    console.error(`the file path doesn't exist. ${filePath}`);
    process.kill(process.pid);
    return;
  }

  const nphiesResponse = await readJsonFile(filePath, true);

  const { id } = nphiesResponse || {};

  const extractedData = mapEntriesAndExtractNeededData(
    nphiesResponse,
    extractionFunctionsMap
  );

  const fileBasename = basename(filePath).replace(".json", "");

  await writeResultFile({
    folderName: `extraction-polls/${fileBasename}`,
    data: {
      mainBundleId: id,
      ...(extractedData || null),
    },
  });
};

await extractPoll("results/pollsResponse/1-res.json");
