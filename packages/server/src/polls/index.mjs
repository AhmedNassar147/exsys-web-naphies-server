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
      delayTimeout: 2 * 1000,
    }),
    runPreauthorizationPoll({
      excludeMessageType: "claim-response",
      delayTimeout: 1 * 60 * 1000,
    }),
  ]);
})();
