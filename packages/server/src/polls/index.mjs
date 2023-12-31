/*
 *
 * Polls: `Index`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import runPreauthorizationPoll from "./runPreauthorizationPoll.mjs";
import runExsysEligibilityPendingRequestsPoll from "./runExsysEligibilityPendingRequestsPoll.mjs";
import stopTheProcessIfCertificateNotFound from "../helpers/stopTheProcessIfCertificateNotFound.mjs";
import { getOrganizationsData } from "../helpers/getConfigFileData.mjs";

const handlePolls = (exsysData) => [
  runPreauthorizationPoll({
    includeMessageType: "claim-response",
    delayTimeout: 2 * 1000,
    exsysData,
  }),
  runPreauthorizationPoll({
    excludeMessageType: "claim-response",
    delayTimeout: 1 * 60 * 1000,
    exsysData,
  }),
];

(async () => {
  await stopTheProcessIfCertificateNotFound();

  await Promise.all([runExsysEligibilityPendingRequestsPoll()]);

  const organizationsData = await getOrganizationsData();
  const organizationsValues = Object.values(organizationsData);

  if (isArrayHasData(organizationsValues)) {
    const preauthPollPromises = organizationsValues
      .map(({ preauthPollData, organizationNo }) =>
        handlePolls({ ...preauthPollData, organizationNo })
      )
      .flat();

    await Promise.all(preauthPollPromises);
  }
})();
