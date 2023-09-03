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
  message_event,
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    asyncFn: async (
      { patientFileNo, contractNo, patientIdNo, organization_no, type },
      requestTimeout
    ) => {
      const message_event_type =
        ELIGIBILITY_TYPES[type] || ELIGIBILITY_TYPES.validation;

      return await fetchExsysEligibilityDataAndCallNphies({
        exsysQueryApiDelayTimeout: requestTimeout,
        nphiesApiDelayTimeout: requestTimeout,
        exsysAPiBodyData: {
          authorization,
          message_event,
          message_event_type,
          organization_no,
          patient_file_no: patientFileNo,
          memberid: patientIdNo,
          contract_no: contractNo,
        },
      });
    },
  });

export default createMappedEligibilityRequests;
