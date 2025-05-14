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
    asyncFn: async ({
      patientFileNo,
      contractNo,
      patientIdNo,
      organization_no,
      type,
      clinicalEntityNo,
      episodeNo,
      visitId,
      doctorId,
      patientContractsSeq,
      staff_id,
      webRequestType,
      patientIdTypeCode,
      patientCardNo,
    }) => {
      const message_event_type =
        ELIGIBILITY_TYPES[type] || ELIGIBILITY_TYPES.validation;

      return await fetchExsysEligibilityDataAndCallNphies({
        exsysAPiBodyData: {
          authorization,
          message_event,
          message_event_type,
          organization_no,
          clinicalEntityNo,
          patient_file_no: patientFileNo,
          memberid: patientCardNo || patientIdNo,
          contract_no: contractNo,
          episode_no: episodeNo,
          visit_id: visitId,
          doctor_id: doctorId,
          patient_contracts_seq: patientContractsSeq,
        },
        extraDataSavingToExsys: {
          web_request_type: webRequestType,
          patient_id_type_code: patientIdTypeCode,
          patient_card_no: patientCardNo,
          staff_id,
        },
      });
    },
  });

export default createMappedEligibilityRequests;
