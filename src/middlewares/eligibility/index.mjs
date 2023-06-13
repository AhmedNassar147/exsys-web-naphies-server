/*
 *
 * `createEligibilityMiddleware`: `middleware`
 *
 */
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import makeEligibilityRequest from "../../nphiesHelpers/eligibility/index.mjs";
import { ELIGIBILITY_TYPES, EXSYS_API_IDS_NAMES } from "../../constants.mjs";

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

const createEligibilityMiddleware = (app) => async (req, res, next) => {
  const { originalUrl } = req;

  app.post(originalUrl, async (req, _, next) => {
    const {
      body: {
        patientFileNo,
        contractNo,
        patientIdNo,
        organization_no,
        authorization,
        type,
      },
    } = req;

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

    const { isSuccess, result } = await createExsysRequest({
      resourceName: EXSYS_API_IDS_NAMES.createNphiesRequest,
      body: bodyData,
    });

    if (isSuccess) {
      console.log({
        result,
        bodyData,
      });
      next();
    }
  });

  next();
};

export default createEligibilityMiddleware;
