/*
 *
 * Helper: `createMappedCommunicationRequests`.
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import fetchPreauthAndClaimCommunicationResponse from "./fetchPreauthAndClaimCommunicationResponse.mjs";

const createMappedCommunicationRequests = async ({
  data,
  authorization,
  printValues,
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    asyncFn: async ({ communicationPk, requestType, mode }) =>
      await fetchPreauthAndClaimCommunicationResponse({
        isCommunicationRequest: mode === "communicationRequest",
        requestParams: {
          authorization,
          communication_pk: communicationPk,
          request_type: requestType,
        },
      }),
  });

export default createMappedCommunicationRequests;
