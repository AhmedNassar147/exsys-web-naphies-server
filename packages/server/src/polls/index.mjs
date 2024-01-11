/*
 *
 * Polls: `Index`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import runPreauthorizationPoll from "./runPreauthorizationPoll.mjs";
import runExsysEligibilityPendingRequestsPoll from "./runExsysEligibilityPendingRequestsPoll.mjs";
import { getConfigFileData } from "../helpers/getConfigFileData.mjs";

(async () => {
  const { organizations, authorization, noAuthorizationOrClaimPolls } =
    await getConfigFileData();

  const organizationsValues = Object.values(organizations);

  const useAuthorizationOrClaimPolls = noAuthorizationOrClaimPolls !== "Y";

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

        if (useAuthorizationOrClaimPolls) {
          acc.preauthPromises.push([
            runPreauthorizationPoll({
              includeMessageType: "claim-response",
              delayTimeout: 2 * 1000,
              preauthPollData,
              ...baseOptions,
            }),
            runPreauthorizationPoll({
              excludeMessageType: "claim-response",
              delayTimeout: 1 * 60 * 1000,
              preauthPollData,
              ...baseOptions,
            }),
          ]);
        }

        return acc;
      },
      {
        eligibilityPromises: [],
        preauthPromises: [],
      }
    );

    await Promise.all(eligibilityPromises);

    if (useAuthorizationOrClaimPolls) {
      await Promise.all(preauthPromises.flat());
    }
  }
})();
