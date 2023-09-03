/*
 *
 * `checkEligibility`: `hardcodedTests`.
 *
 */
import { isArrayHasData, createCmdMessage } from "@exsys-web-server/helpers";
import stopTheProcessIfCertificateNotFound from "../helpers/stopTheProcessIfCertificateNotFound.mjs";
import createMappedEligibilityRequests from "../exsysHelpers/createMappedEligibilityRequests.mjs";
import { SERVER_CONFIG } from "../constants.mjs";

const { patients, authorization } = SERVER_CONFIG;

(async () => {
  await stopTheProcessIfCertificateNotFound();
  const canRunTest = isArrayHasData(patients);

  if (!canRunTest) {
    createCmdMessage({
      type: "error",
      message: `You need to configure ${chalk.white.bold(
        "patients"
      )} in ${chalk.white.bold("config.json")} file`,
    });
    return;
  }

  await createMappedEligibilityRequests({
    data: patients,
    authorization,
    message_event: "eligibility",
  });
})();
