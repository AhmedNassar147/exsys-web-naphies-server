/*
 *
 * `createClaimMiddleware`: `middleware`
 *
 */
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";
import createClaimMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchExsysPreauthorizationDataAndCallNphies from "../../exsysHelpers/fetchExsysPreauthorizationDataAndCallNphies.mjs";

export default createClaimMiddleware(
  async ({
    authorization,
    patientFileNo,
    episodeNo,
    episodeInvoiceNo,
    organizationNo,
  }) =>
    await fetchExsysPreauthorizationDataAndCallNphies({
      requestMethod: "GET",
      nphiesRequestType: NPHIES_REQUEST_TYPES.CLAIM,
      requestParams: {
        authorization,
        patient_file_no: patientFileNo,
        episode_no: episodeNo,
        episode_invoice_no: episodeInvoiceNo,
        organization_no: organizationNo,
      },
      printValues: true,
    })
);
