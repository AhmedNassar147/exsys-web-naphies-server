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
import { EXSYS_API_IDS_NAMES, EXSYS_POLLS_TIMEOUT } from "../constants.mjs";
import fetchExsysEligibilityDataAndCallNphies from "../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";

const { queryEligibilityPendingRequests } = EXSYS_API_IDS_NAMES;

/**
 * options = {
    authorization,
    organizationNo,
    clinicalEntityNo,
  }
 */
const runExsysEligibilityPendingRequestsPoll = async (options) => {
  const requestOptions = {
    requestMethod: "GET",
    exsysApiId: queryEligibilityPendingRequests,
    noPatientDataLogger: true,
    printFolderName: "eligibilityPoll",
    requestParams: options,
    isPollRequest: true,
  };
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
    await runExsysEligibilityPendingRequestsPoll(options);
  }
};

export default runExsysEligibilityPendingRequestsPoll;
