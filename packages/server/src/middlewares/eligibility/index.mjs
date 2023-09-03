/*
 *
 * `createEligibilityMiddleware`: `middleware`
 *
 */
import createEligibilityMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createMappedEligibilityRequests from "../../exsysHelpers/createMappedEligibilityRequests.mjs";

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
  const { authorization, printValues = false, data } = body;

  const message_event = originalUrl.replace("/", "");

  return await createMappedEligibilityRequests({
    data,
    authorization,
    printValues,
    message_event,
  });
});
