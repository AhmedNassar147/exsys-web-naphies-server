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
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    asyncFn: async ({
      patientFileNo,
      episodeInvoiceNo,
      organizationNo,
      claimPk,
      authorizationNo,
    }) =>
      await fetchExsysPreauthOrClaimDataForNphiesCancellation({
        nphiesRequestType: NPHIES_REQUEST_TYPES.CLAIM,
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
