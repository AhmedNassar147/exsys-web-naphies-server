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

const nodeJsInternal = setInterval(
  async () => await fetchExsysEligibilityDataAndCallNphies(requestOptions),
  EXSYS_POLLS_TIMEOUT
);

const closeInterval = () => clearInterval(nodeJsInternal);

process.on("beforeExit", closeInterval);
process.on("exit", closeInterval);
