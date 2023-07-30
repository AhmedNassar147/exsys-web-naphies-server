/*
 *
 * Helper: `removeUnwantedClaimsToCancellation`.
 *
 */
import chalk from "chalk";
import {
  createCmdMessage,
  delayProcess,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import {
  EXSYS_API_IDS_NAMES,
  EXSYS_API_IDS,
  RETRY_DELAY,
} from "../constants.mjs";
import createMappedClaimRequestsToCancellation from "./createMappedClaimRequestsToCancellation.mjs";

const { queryUnwantedClaimsDataToCancellation } = EXSYS_API_IDS_NAMES;
const exsysApiBaseUrl = EXSYS_API_IDS[queryUnwantedClaimsDataToCancellation];

const poffsetStep = 100;

const stopProcessIfNoData = () => {
  createCmdMessage({
    type: "info",
    message: "no unwanted claims exsist anymore",
  });

  process.exit();
};

const removeUnwantedClaimsToCancellation = async (poffset = 0) => {
  const { isSuccess, error, result } = await createExsysRequest({
    resourceName: queryUnwantedClaimsDataToCancellation,
    requestMethod: "GET",
    retryTimes: 1,
    requestParams: {
      poffset,
      poffset_step: poffsetStep,
    },
  });

  if (!isSuccess || error) {
    createCmdMessage({
      type: "error",
      message: `error when calling ${exsysApiBaseUrl} ${chalk.bold.cyan(
        `retrying in ${RETRY_DELAY / 1000} seconds`
      )}`,
    });

    await delayProcess(RETRY_DELAY);
    await removeUnwantedClaimsToCancellation(poffset);

    return;
  }

  const { data } = result || {};

  if (isArrayHasData(data)) {
    try {
      await createMappedClaimRequestsToCancellation({
        data,
        printValues: false,
      });
    } catch (error) {
      console.error("error from cancellation", error);
    } finally {
      createCmdMessage({
        type: "info",
        message: "starting next cancellation",
      });

      await removeUnwantedClaimsToCancellation(poffset + poffsetStep);
    }

    return;
  }

  stopProcessIfNoData();
};

await removeUnwantedClaimsToCancellation(0);
