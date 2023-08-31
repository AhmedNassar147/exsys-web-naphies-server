/*
 *
 * Helper: `createMappedClaimOrPreauthCancellationOrStatusCheck`.
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import createNphiesCancellationPreauthOrClaimData from "./createNphiesCancellationPreauthOrClaimData.mjs";
import createNphiesStatusCheckPreauthOrClaimData from "./createNphiesStatusCheckPreauthOrClaimData.mjs";

const createMappedClaimOrPreauthCancellationOrStatusCheck = async ({
  data,
  authorization,
  printValues,
  formatReturnedResults,
  isStatusCheck,
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    formatReturnedResults,
    asyncFn: async (
      {
        patientFileNo,
        organizationNo,
        authorizationNo,
        recordPk,
        requestType,
        nullifyRequest,
      },
      requestTimeout
    ) => {
      const options = {
        exsysQueryApiDelayTimeout: requestTimeout,
        nphiesApiDelayTimeout: requestTimeout,
        requestParams: {
          authorization: authorizationNo || authorization,
          patient_file_no: patientFileNo,
          organization_no: organizationNo,
          request_type: requestType,
          record_pk: recordPk,
          ...(isStatusCheck
            ? null
            : {
                nullify_request: nullifyRequest,
              }),
        },
      };

      const fn = isStatusCheck
        ? createNphiesStatusCheckPreauthOrClaimData
        : createNphiesCancellationPreauthOrClaimData;

      return await fn(options);
    },
  });

export default createMappedClaimOrPreauthCancellationOrStatusCheck;
