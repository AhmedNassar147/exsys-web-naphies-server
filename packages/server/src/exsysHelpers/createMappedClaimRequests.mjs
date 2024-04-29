/*
 *
 * Helper: `createMappedClaimRequests`.
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import fetchExsysClaimDataAndCallNphies from "./fetchExsysPreauthorizationDataAndCallNphies.mjs";
import { NPHIES_REQUEST_TYPES } from "../constants.mjs";

const createMappedClaimRequests = async ({
  data,
  authorization,
  clientName,
  printValues,
  formatReturnedResults,
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    formatReturnedResults,
    asyncFn: async ({
      patientFileNo,
      episodeNo,
      episodeInvoiceNo,
      organizationNo,
      messageEventType,
      clinicalEntityNo,
    }) =>
      await fetchExsysClaimDataAndCallNphies({
        nphiesRequestType: NPHIES_REQUEST_TYPES.CLAIM,
        requestParams: {
          authorization,
          patient_file_no: patientFileNo,
          episode_no: episodeNo,
          episode_invoice_no: episodeInvoiceNo,
          organization_no: organizationNo,
          clinicalEntityNo,
          message_event_type: messageEventType,
          clientName,
        },
      }),
  });

export default createMappedClaimRequests;
