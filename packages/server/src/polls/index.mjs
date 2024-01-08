/*
 *
 * Polls: `Index`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import runPreauthorizationPoll from "./runPreauthorizationPoll.mjs";
import runExsysEligibilityPendingRequestsPoll from "./runExsysEligibilityPendingRequestsPoll.mjs";
import { getConfigFileData } from "../helpers/getConfigFileData.mjs";

const handlePreauthPolls = (exsysData) => [
  runPreauthorizationPoll({
    includeMessageType: "claim-response",
    delayTimeout: 2 * 1000,
    ...exsysData,
  }),
  runPreauthorizationPoll({
    excludeMessageType: "claim-response",
    delayTimeout: 1 * 60 * 1000,
    ...exsysData,
  }),
];

(async () => {
  const { organizations, authorization } = await getConfigFileData();

  const organizationsValues = Object.values(organizations);

  if (isArrayHasData(organizationsValues)) {
    const { eligibilityPromises, preauthPromises } = organizationsValues.reduce(
      (acc, { organizationNo, clinicalEntityNo, preauthPollData }) => {
        const baseOptions = {
          authorization,
          organizationNo,
          clinicalEntityNo,
        };

        acc.eligibilityPromises.push(
          runExsysEligibilityPendingRequestsPoll(baseOptions)
        );

        acc.preauthPromises.push(
          handlePreauthPolls({ ...baseOptions, preauthPollData })
        );

        return acc;
      },
      {
        eligibilityPromises: [],
        preauthPromises: [],
      }
    );

    await Promise.all(eligibilityPromises);
    await Promise.all(preauthPromises.flat());
  }
})();
