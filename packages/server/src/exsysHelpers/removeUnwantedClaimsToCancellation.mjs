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

const poffsetStep = 70;

const stopProcessIfNoData = () => {
  createCmdMessage({
    type: "info",
    message: "no unwanted claims exsist anymore",
  });

  process.kill(process.pid);
};

const removeUnwantedClaimsToCancellation = async (poffset = 0) => {
  const { isSuccess, error, result } = createExsysRequest({
    resourceName: queryUnwantedClaimsDataToCancellation,
    requestMethod: "GET",
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
    const [{ total }] = data;
    // await createMappedClaimRequestsToCancellation({ data, printValues: false });
    const nextOffset = poffset + poffsetStep;
    const remaining = total - nextOffset;

    console.log({
      poffset,
      poffsetStep,
      nextOffset,
      total,
      remaining,
    });

    if (remaining) {
      createCmdMessage({
        type: "info",
        message: `starting next cancellation after ${chalk.bold.white(
          "1 second"
        )}`,
      });
      await delayProcess(1000);
      await removeUnwantedClaimsToCancellation(nextOffset);
    }

    stopProcessIfNoData();
    return;
  }

  stopProcessIfNoData();
};
