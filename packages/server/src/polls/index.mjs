/*
 *
 * Polls: `Index`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import runPreauthorizationPoll from "./runPreauthorizationPoll.mjs";
import runExsysEligibilityPendingRequestsPoll from "./runExsysEligibilityPendingRequestsPoll.mjs";
import { getConfigFileData } from "../helpers/getConfigFileData.mjs";

const createOrganizationsPollPromises = ({
  organizations,
  authorization,
  clientName,
  useAuthorizationOrClaimPolls,
}) => {
  const organizationsValues = Object.values(organizations);

  if (isArrayHasData(organizationsValues)) {
    const { eligibilityPromises, preauthPromises } = organizationsValues.reduce(
      (
        acc,
        { organizationNo, clinicalEntityNo, preauthPollData, dbBaseUrl }
      ) => {
        const baseOptions = {
          authorization,
          organizationNo,
          clinicalEntityNo,
          clientName,
        };

        acc.eligibilityPromises.push(
          runExsysEligibilityPendingRequestsPoll(baseOptions)
        );

        if (useAuthorizationOrClaimPolls) {
          acc.preauthPromises.push([
            runPreauthorizationPoll({
              includeMessageType: "claim-response",
              preauthPollData,
              dbBaseUrl,
              ...baseOptions,
            }),
            runPreauthorizationPoll({
              excludeMessageType: "claim-response",
              preauthPollData,
              dbBaseUrl,
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

    return {
      eligibilityPromises,
      preauthPromises: preauthPromises.flat(),
    };
  }

  return {
    eligibilityPromises: [],
    preauthPromises: [],
  };
};

(async () => {
  const { clients } = await getConfigFileData();

  const clientKeys = Object.keys(clients);

  if (isArrayHasData(clientKeys)) {
    const { eligibilityPromises, preauthPromises } = clientKeys.reduce(
      (acc, clientName) => {
        const { noAuthorizationOrClaimPolls, authorization, organizations } =
          clients[clientName];

        if (!!organizations) {
          const useAuthorizationOrClaimPolls =
            noAuthorizationOrClaimPolls !== "Y";

          const {
            eligibilityPromises: __eligibilityPromises,
            preauthPromises: __preauthPromises,
          } = createOrganizationsPollPromises({
            organizations,
            authorization,
            clientName,
            useAuthorizationOrClaimPolls,
          });

          if (__eligibilityPromises.length) {
            acc.eligibilityPromises.push(...__eligibilityPromises);
          }

          if (__preauthPromises.length) {
            acc.preauthPromises.push(...__preauthPromises);
          }
        }

        return acc;
      },
      {
        eligibilityPromises: [],
        preauthPromises: [],
      }
    );

    const allPromises = [...eligibilityPromises, ...preauthPromises]
      .filter(Boolean)
      .flat();

    if (allPromises.length) {
      await Promise.all(allPromises);
    }
  }
})();
