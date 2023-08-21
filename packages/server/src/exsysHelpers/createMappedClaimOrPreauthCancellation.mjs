/*
 *
 * Helper: `createMappedClaimOrPreauthCancellation`.
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import createNphiesCancellationPreauthOrClaimData from "./createNphiesCancellationPreauthOrClaimData.mjs";

const createMappedClaimOrPreauthCancellation = async ({
  data,
  authorization,
  printValues,
  formatReturnedResults,
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    formatReturnedResults,
    asyncFn: async (
      { patientFileNo, organizationNo, authorizationNo, recordPk, requestType },
      requestTimeout
    ) =>
      await createNphiesCancellationPreauthOrClaimData({
        exsysQueryApiDelayTimeout: requestTimeout,
        nphiesApiDelayTimeout: requestTimeout,
        requestParams: {
          authorization: authorizationNo || authorization,
          patient_file_no: patientFileNo,
          organization_no: organizationNo,
          request_type: requestType,
          record_pk: recordPk,
        },
      }),
  });

export default createMappedClaimOrPreauthCancellation;
