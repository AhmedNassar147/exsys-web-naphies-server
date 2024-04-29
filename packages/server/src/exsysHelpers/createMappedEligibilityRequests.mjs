/*
 *
 * Helper: `createMappedEligibilityRequests`.
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import fetchExsysEligibilityDataAndCallNphies from "./fetchExsysEligibilityDataAndCallNphies.mjs";
import { ELIGIBILITY_TYPES } from "../constants.mjs";

const createMappedEligibilityRequests = async ({
  data,
  authorization,
  printValues,
  messageEvent,
  clientName,
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    asyncFn: async ({
      patientFileNo,
      contractNo,
      patientIdNo,
      organization_no,
      type,
      clinicalEntityNo,
    }) => {
      const message_event_type =
        ELIGIBILITY_TYPES[type] || ELIGIBILITY_TYPES.validation;

      return await fetchExsysEligibilityDataAndCallNphies({
        exsysAPiBodyData: {
          authorization,
          message_event: messageEvent,
          message_event_type,
          organization_no,
          clinicalEntityNo,
          patient_file_no: patientFileNo,
          memberid: patientIdNo,
          contract_no: contractNo,
          clientName,
        },
      });
    },
  });

export default createMappedEligibilityRequests;
