/*
 *
 * Helper: `runExsysEligibilityPendingRequestsPoll`.
 *
 */
import {
  delayProcess,
  createCmdMessage,
  writeResultFile,
} from "@exsys-web-server/helpers";
import {
  SERVER_CONFIG,
  EXSYS_API_IDS_NAMES,
  EXSYS_POLLS_TIMEOUT,
} from "../constants.mjs";
import fetchExsysEligibilityDataAndCallNphies from "../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";

const { authorization } = SERVER_CONFIG;
const { checkExsysPollPendingRequests } = EXSYS_API_IDS_NAMES;

const requestOptions = {
  requestMethod: "GET",
  exsysApiId: checkExsysPollPendingRequests,
  requestParams: {
    authorization,
  },
};

const runExsysEligibilityPendingRequestsPoll = async () => {
  try {
    const {
      printData: { data, isError, folderName },
    } = await fetchExsysEligibilityDataAndCallNphies(requestOptions);

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
      message: `Error from Eligibility polling\n ${error}`,
    });
  } finally {
    await delayProcess(EXSYS_POLLS_TIMEOUT);
    await runExsysEligibilityPendingRequestsPoll();
  }
};

export default runExsysEligibilityPendingRequestsPoll;
