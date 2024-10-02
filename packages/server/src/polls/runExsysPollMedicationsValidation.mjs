/*
 *
 * Helper: `runExsysPollMedicationsValidation`.
 *
 */
import {
  delayProcess,
  createCmdMessage,
  writeResultFile,
} from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import {
  EXSYS_API_IDS_NAMES,
  EXSYS_POLLS_TIMEOUT,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";
import fetchExsysMedicationCheckingDataAndCallNphies from "../exsysHelpers/fetchExsysMedicationCheckingDataAndCallNphies.mjs";

const { queryMedicationsValidationPollData } = EXSYS_API_IDS_NAMES;
const { PRESCRIBER } = NPHIES_REQUEST_TYPES;

const runExsysPollMedicationsValidation = async (authorization) => {
  const { visitId } = createExsysRequest({
    resourceName: queryMedicationsValidationPollData,
    requestMethod: "GET",
    requestParams: {
      authorization,
    },
  });

  if (!visitId) {
    await delayProcess(EXSYS_POLLS_TIMEOUT);
    await runExsysPollMedicationsValidation(authorization);
    return;
  }

  try {
    const {
      printData: { data, isError, folderName },
    } = await fetchExsysMedicationCheckingDataAndCallNphies({
      isRunningFromPoll: true,
      nphiesRequestType: PRESCRIBER,
      requestParams: { visitId, authorization },
    });

    await writeResultFile({
      folderName,
      data: {
        isError,
        ...data,
      },
    });
  } catch (error) {
    createCmdMessage({
      type: "error",
      message: `Error from special exsys medications validation polling\n ${error}`,
    });
  } finally {
    await delayProcess(EXSYS_POLLS_TIMEOUT);
    await runExsysPollMedicationsValidation(authorization);
  }
};

export default runExsysPollMedicationsValidation;
