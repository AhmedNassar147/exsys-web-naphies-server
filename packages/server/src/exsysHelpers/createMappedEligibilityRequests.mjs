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
    asyncFn: ({ patientFileNo, contractNo, patientIdNo, organization_no }) =>
      fetchExsysEligibilityDataAndCallNphies({
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
