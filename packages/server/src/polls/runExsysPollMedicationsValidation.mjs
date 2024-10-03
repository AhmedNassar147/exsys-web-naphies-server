/*
 *
 * Helper: `runExsysPollMedicationsValidation`.
 *
 */
import chalk from "chalk";
import {
  delayProcess,
  createCmdMessage,
  createApiResultsAndLoggerValues,
  createPrintResultsOrLog,
} from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import fetchExsysMedicationCheckingDataAndCallNphies from "../exsysHelpers/fetchExsysMedicationCheckingDataAndCallNphies.mjs";
import {
  EXSYS_API_IDS_NAMES,
  EXSYS_POLLS_TIMEOUT,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";

const { queryMedicationsValidationPollData } = EXSYS_API_IDS_NAMES;
const { PRESCRIBER } = NPHIES_REQUEST_TYPES;

const __EXSYS_POLLS_TIMEOUT = EXSYS_POLLS_TIMEOUT * 3;

const runExsysPollMedicationsValidation = async (authorization) => {
  try {
    const { result } = await createExsysRequest({
      resourceName: queryMedicationsValidationPollData,
      requestMethod: "GET",
      requestParams: {
        authorization,
      },
    });

    const { visitId } = result;

    if (!visitId) {
      await delayProcess(__EXSYS_POLLS_TIMEOUT);
      createCmdMessage({
        type: "info",
        message: `couldn't find visitId in exsys prescriber poll ${chalk.green(
          "refetch...."
        )}`,
      });
      await runExsysPollMedicationsValidation(authorization);
      return;
    }

    const apiFetchResult = await fetchExsysMedicationCheckingDataAndCallNphies({
      isRunningFromPoll: true,
      nphiesRequestType: PRESCRIBER,
      requestParams: { preauth_pk: visitId, authorization },
    });

    const { printInfo, loggerValues } = await createApiResultsAndLoggerValues([
      apiFetchResult,
    ]);

    await createPrintResultsOrLog({
      printValues: true,
      printData: printInfo,
      loggerValues,
    });
  } catch (error) {
    createCmdMessage({
      type: "error",
      message: `Error from exsys medications validation polling\n ${error}`,
    });
  } finally {
    await delayProcess(__EXSYS_POLLS_TIMEOUT);
    await runExsysPollMedicationsValidation(authorization);
  }
};

export default runExsysPollMedicationsValidation;
