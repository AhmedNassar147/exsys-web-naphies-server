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
    asyncFn: async (
      { patientFileNo, organizationNo, recordPk, requestType },
      requestTimeout
    ) =>
      await fetchPreauthAndClaimCommunicationResponse({
        exsysQueryApiDelayTimeout: requestTimeout,
        nphiesApiDelayTimeout: requestTimeout,
        requestParams: {
          authorization,
          patient_file_no: patientFileNo,
          organization_no: organizationNo,
          record_pk: recordPk,
          request_type: requestType,
        },
      }),
  });

export default createMappedCommunicationRequests;
