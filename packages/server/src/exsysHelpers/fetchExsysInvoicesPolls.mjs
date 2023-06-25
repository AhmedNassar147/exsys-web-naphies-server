/*
 *
 * Helper: `fetchExsysInvoicesPolls`.
 *
 */
import { delayProcess } from "@exsys-web-server/helpers";
import {
  SERVER_CONFIG,
  EXSYS_API_IDS_NAMES,
  EXSYS_POLLS_TIMEOUT,
} from "../constants.mjs";
import fetchExsysEligibilityDataAndCallNphies from "./fetchExsysEligibilityDataAndCallNphies.mjs";

const { authorization } = SERVER_CONFIG;
const { checkExsysPollPendingRequests } = EXSYS_API_IDS_NAMES;

const requestOptions = {
  requestMethod: "GET",
  exsysApiId: checkExsysPollPendingRequests,
  requestParams: {
    authorization,
  },
};

const fetchPendingRequestsData = async () => {
  try {
    await fetchExsysEligibilityDataAndCallNphies(requestOptions);
  } catch (error) {
    console.log("error from polling", error);
  } finally {
    delayProcess(EXSYS_POLLS_TIMEOUT);
    await fetchPendingRequestsData();
  }
};

await fetchPendingRequestsData();
