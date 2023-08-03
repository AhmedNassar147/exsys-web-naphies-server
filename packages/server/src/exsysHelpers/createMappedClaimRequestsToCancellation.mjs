/*
 *
 * Helper: `createMappedClaimRequestsToCancellation`.
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import fetchExsysPreauthOrClaimDataForNphiesCancellation from "./fetchExsysPreauthOrClaimDataForNphiesCancellation.mjs";
import { NPHIES_REQUEST_TYPES } from "../constants.mjs";

const createMappedClaimRequestsToCancellation = async ({
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
      {
        patientFileNo,
        episodeInvoiceNo,
        organizationNo,
        claimPk,
        authorizationNo,
      },
      requestTimeout
    ) =>
      await fetchExsysPreauthOrClaimDataForNphiesCancellation({
        nphiesRequestType: NPHIES_REQUEST_TYPES.CLAIM,
        exsysQueryApiDelayTimeout: requestTimeout,
        nphiesApiDelayTimeout: requestTimeout,
        requestParams: {
          authorization: authorization || authorizationNo,
          patient_file_no: patientFileNo,
          invoice_no: episodeInvoiceNo,
          organization_no: organizationNo,
          claim_pk: claimPk,
        },
      }),
  });

export default createMappedClaimRequestsToCancellation;
