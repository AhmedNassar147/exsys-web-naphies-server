/*
 *
 * Helper: `fetchExsysInvoicesPolls`.
 *
 */
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

(() => {
  setInterval(async () => {
    console.log("polls");
    await fetchExsysEligibilityDataAndCallNphies(requestOptions);
  }, EXSYS_POLLS_TIMEOUT);
})();
