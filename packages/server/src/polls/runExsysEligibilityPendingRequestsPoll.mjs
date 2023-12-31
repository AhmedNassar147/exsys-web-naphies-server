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
  EXSYS_API_IDS_NAMES,
  EXSYS_POLLS_TIMEOUT,
  BASE_RESULT_FOLDER_BATH,
} from "../constants.mjs";
import fetchExsysEligibilityDataAndCallNphies from "../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";
import { getConfigFileData } from "../helpers/getConfigFileData.mjs";

const { authorization } = await getConfigFileData();
const { queryEligibilityPendingRequests } = EXSYS_API_IDS_NAMES;

const requestOptions = {
  requestMethod: "GET",
  exsysApiId: queryEligibilityPendingRequests,
  noPatientDataLogger: true,
  printFolderName: "eligibilityPoll",
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
      folderName: `${BASE_RESULT_FOLDER_BATH}/${folderName}`,
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
