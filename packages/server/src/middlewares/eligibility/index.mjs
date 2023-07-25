/*
 *
 * `createEligibilityMiddleware`: `middleware`
 *
 */
import { ELIGIBILITY_TYPES } from "../../constants.mjs";
import createEligibilityMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchExsysEligibilityDataAndCallNphies from "../../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";

// all body params
// "authorization": 5361528,
// "message_event": "eligibility" ,
// "message_event_type": "discovery" ,
// "organization_no": "001" ,
// "patient_file_no": "217540" ,
// "memberid": "001076877321101" ,
// "contract_no": "17204" ,

// "episode_no": "" ,
// "visit_id": "" ,
// "doctor_id": "" ,
// "patient_contracts_seq": "" ,
// "episode_invoice_no": "" ,
// "statement_no": "" ,

export default createEligibilityMiddleware(async (body, originalUrl) => {
  const {
    patientFileNo,
    contractNo,
    patientIdNo,
    organization_no,
    authorization,
    type,
    printValues = false,
  } = body;

  const message_event = originalUrl.replace("/", "");
  const message_event_type =
    ELIGIBILITY_TYPES[type] || ELIGIBILITY_TYPES.validation;

  const bodyData = {
    authorization,
    message_event,
    message_event_type,
    organization_no,
    patient_file_no: patientFileNo,
    memberid: patientIdNo,
    contract_no: contractNo,
  };

  return await fetchExsysEligibilityDataAndCallNphies({
    exsysAPiBodyData: bodyData,
    printValues,
  });
});
