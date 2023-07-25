/*
 *
 * `checkClaim`: `hardcodedTests`.
 *
 */
import chalk from "chalk";
import { isArrayHasData, createCmdMessage } from "@exsys-web-server/helpers";
import stopTheProcessIfCertificateNotFound from "../helpers/stopTheProcessIfCertificateNotFound.mjs";
import createMappedClaimRequests from "../exsysHelpers/createMappedClaimRequests.mjs";
import { SERVER_CONFIG } from "../constants.mjs";

const { claimTestData, authorization } = SERVER_CONFIG;

(async () => {
  await stopTheProcessIfCertificateNotFound();
  const canRunTest = isArrayHasData(claimTestData);

  if (!canRunTest) {
    createCmdMessage({
      type: "error",
      message: `You need to configure ${chalk.white.bold(
        "claimTestData"
      )} in ${chalk.white.bold("config.json")} file`,
    });
    return;
  }

  await createMappedClaimRequests({
    data: claimTestData,
    authorization,
  });
})();
