/*
 *
 * Polls: `Index`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import runExsysEligibilityPendingRequestsPoll from "./runExsysEligibilityPendingRequestsPoll.mjs";
import runPreauthorizationPoll from "./runPreauthorizationPoll.mjs";
import runExsysPollMedicationsValidation from "./runExsysPollMedicationsValidation.mjs";
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
            // runPreauthorizationPoll({
            //   includeMessageType: "claim-response",
            //   preauthPollData,
            //   ...baseOptions,
            // }),
            // runPreauthorizationPoll({
            //   excludeMessageType: "claim-response",
            //   preauthPollData,
            //   ...baseOptions,
            // }),
            // runPreauthorizationPoll({
            //   includeMessageType: "prescriber-response",
            //   preauthPollData,
            //   ...baseOptions,
            // }),

            runPreauthorizationPoll({
              includeMessageType: "priorauth-response",
              preauthPollData,
              ...baseOptions,
              messagesCount: 1,
            }),

            runPreauthorizationPoll({
              includeMessageType: "communication-request",
              preauthPollData,
              ...baseOptions,
              messagesCount: 1,
            }),

            runPreauthorizationPoll({
              excludeMessageType: "priorauth-response",
              preauthPollData,
              ...baseOptions,
              messagesCount: 50,
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

    await Promise.all([
      // runExsysPollMedicationsValidation(authorization),
      ...eligibilityPromises,
    ]);

    if (useAuthorizationOrClaimPolls) {
      await Promise.all(preauthPromises.flat());
    }
  }
})();
