/*
 *
 * Helper: `createMappedEligibilityRequests`.
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import fetchExsysEligibilityDataAndCallNphies from "./fetchExsysEligibilityDataAndCallNphies.mjs";

const createMappedEligibilityRequests = async ({
  data,
  authorization,
  printValues,
  message_event,
  message_event_type,
}) =>
  await createMappedRequestsArray({
    dataArray: data,
    printValues,
    asyncFn: async (
      { patientFileNo, contractNo, patientIdNo, organization_no },
      requestTimeout
    ) =>
      await fetchExsysEligibilityDataAndCallNphies({
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
      }),
  });

export default createMappedEligibilityRequests;
