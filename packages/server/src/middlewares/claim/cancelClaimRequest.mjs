/*
 *
 * `cancelClaimRequest`: `middleware`
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import createClaimMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchExsysPreauthOrClaimDataForNphiesCancellation from "../../exsysHelpers/fetchExsysPreauthOrClaimDataForNphiesCancellation.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

export default createClaimMiddleware(
  async ({ authorization, printValues = false, data }) =>
    createMappedRequestsArray({
      dataArray: data,
      printValues,
      asyncFn: async ({ patientFileNo, invoiceNo, organizationNo, claimPk }) =>
        await fetchExsysPreauthOrClaimDataForNphiesCancellation({
          requestMethod: "GET",
          nphiesRequestType: NPHIES_REQUEST_TYPES.CLAIM,
          requestParams: {
            authorization,
            patient_file_no: patientFileNo,
            invoice_no: invoiceNo,
            organization_no: organizationNo,
            claim_pk: claimPk,
          },
        }),
    })
);
