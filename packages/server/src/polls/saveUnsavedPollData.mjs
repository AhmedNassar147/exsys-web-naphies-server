/*
 *
 * Helper: `saveUnsavedPollData`.
 *
 */

import { readJsonFile } from "@exsys-web-server/helpers";
import savePreauthPollDataToExsys from "./savePreauthPollDataToExsys.mjs";

const saveUnsavedPollData = async (fileUrl) => {
  const data = await readJsonFile(fileUrl, true);
  const [{ nodeServerDataSentToNaphies, nphiesResponse, nphiesExtractedData }] =
    data || [{}];

  const result = await savePreauthPollDataToExsys({
    authorization: 111111,
    nodeServerDataSentToNaphies,
    nphiesResponse,
    nphiesExtractedData,
    requestType: nphiesExtractedData.messageHeaderRequestType,
    logParams: true,
  });

  console.log("result", result);
};

const fileUrl = "";
await saveUnsavedPollData(fileUrl);
