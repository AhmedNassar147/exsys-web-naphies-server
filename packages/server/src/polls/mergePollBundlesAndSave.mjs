/*
 *
 * Helper: `mergePollBundlesAndSave`.
 *
 */
import chalk from "chalk";
import {
  createCmdMessage,
  isArrayHasData,
  // findRootYarnWorkSpaces,
  // readJsonFile,
} from "@exsys-web-server/helpers";
import savePreauthPollDataToExsys from "./savePreauthPollDataToExsys.mjs";
import { NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { PRESCRIBER } = NPHIES_REQUEST_TYPES;

const extractNphiesResponseBasedOnBundleId = (bundleId, allNphiesResponse) => {
  const { entry, ...others } = allNphiesResponse;

  const entries = entry.filter(({ resource: { resourceType, id } }) => {
    const isTaskOrMessageHeader = ["MessageHeader", "Task"].includes(
      resourceType
    );

    const isBundle = resourceType === "Bundle";
    const isSameBundle = id === bundleId;

    return isTaskOrMessageHeader || (isBundle && isSameBundle);
  });

  return {
    ...others,
    entry: entries,
  };
};

const processBundleItem = async ({
  currentItem,
  authorization,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  logParams,
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
    logParams,
  });
};

const mergePollBundlesAndSave = async ({
  authorization,
  nphiesExtractedData,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  logParams,
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

        const { bundleId } = item;

        const foundNphiesResponse = extractNphiesResponseBasedOnBundleId(
          bundleId,
          nphiesResponse
        );

        return processBundleItem({
          currentItem,
          authorization,
          nodeServerDataSentToNaphies,
          nphiesResponse: foundNphiesResponse,
          // logParams,
          logParams: true,
        });
      })
    : undefined;

  if (isArrayHasData(promises)) {
    return await Promise.all(promises);
  }

  await Promise.resolve();
};

export default mergePollBundlesAndSave;

// const base = await findRootYarnWorkSpaces();
// const [{ nodeServerDataSentToNaphies, nphiesResponse, nphiesExtractedData }] =
//   await readJsonFile(`${base}/results/blg/ahmed/23-10-2024.json`, true);

// await mergePollBundlesAndSave({
//   authorization: 111111,
//   nphiesExtractedData,
//   nodeServerDataSentToNaphies,
//   nphiesResponse,
// });
