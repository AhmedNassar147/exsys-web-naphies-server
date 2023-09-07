/*
 *
 * Polls: `Index`.
 *
 */
import runPreauthorizationPoll from "./runPreauthorizationPoll.mjs";
import runExsysEligibilityPendingRequestsPoll from "./runExsysEligibilityPendingRequestsPoll.mjs";
import stopTheProcessIfCertificateNotFound from "../helpers/stopTheProcessIfCertificateNotFound.mjs";

(async () => {
  await stopTheProcessIfCertificateNotFound();

  await Promise.all([
    runExsysEligibilityPendingRequestsPoll(),
    runPreauthorizationPoll({
      includeMessageType: "claim-response",
      delayTimeout: 250,
    }),
    runPreauthorizationPoll({
      excludeMessageType: "claim-response",
      delayTimeout: 6 * 1000,
    }),
  ]);
})();
