/*
 *
 * Helper: `mergePollBundlesAndSave`.
 *
 */
import chalk from "chalk";
import { createCmdMessage, isArrayHasData } from "@exsys-web-server/helpers";
import savePreauthPollDataToExsys from "./savePreauthPollDataToExsys.mjs";

const processBundleItem = async ({
  currentItem,
  authorization,
  nodeServerDataSentToNaphies,
  nphiesResponse,
}) => {
  const { messageHeaderRequestType, originalHeaderRequestType } =
    currentItem || {};

  const isEmptyPoll =
    messageHeaderRequestType === "poll" && !originalHeaderRequestType;

  const isPrescriberResponse = (messageHeaderRequestType || "").includes(
    PRESCRIBER
  );

  if (isEmptyPoll) {
    createCmdMessage({
      type: "info",
      message: `${
        isPrescriberResponse ? "prescription" : "Authorization"
      } poll has no messages yet ${chalk.bold.white(
        `when request_type_is=${messageHeaderRequestType}`
      )}`,
    });

    return await Promise.resolve();
  }

  return await savePreauthPollDataToExsys({
    authorization,
    nodeServerDataSentToNaphies,
    nphiesResponse,
    nphiesExtractedData: currentItem,
    requestType: messageHeaderRequestType,
  });
};

const mergePollBundlesAndSave = async ({
  authorization,
  nphiesExtractedData,
  nodeServerDataSentToNaphies,
  nphiesResponse,
}) => {
  const { pollBundles, nphiesRequestExtractedData, ...baseExtractedData } =
    nphiesExtractedData || {};

  const promises = isArrayHasData(pollBundles)
    ? pollBundles.map((item) => {
        const currentItem = {
          ...baseExtractedData,
          ...item,
          nphiesRequestExtractedData,
        };

        return processBundleItem({
          currentItem,
          authorization,
          nodeServerDataSentToNaphies,
          nphiesResponse,
        });
      })
    : undefined;

  return await (isArrayHasData(promises)
    ? Promise.all(promises)
    : Promise.resolve());
};

export default mergePollBundlesAndSave;
