/*
 *
 * `createEligibilityMiddleware`: `middleware`
 *
 */
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import createNaphiesRequestFullData from "../../nphiesHelpers/eligibility/index.mjs";
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
      const {
        primaryKey,
        data: {
          site_url,
          site_name,
          site_tel,
          official_name,
          official_f_name,
          provider_license,
          provider_organization,
          provider_location,
          location_license,
          payer_license,
          payer_organization,
          payer_name,
          memberid,
          iqama_no,
          gender,
          birthDate,
          period_start_date,
          period_end_date,
        },
      } = result;

      const values = createNaphiesRequestFullData({
        provider_license,
        request_id: primaryKey,
        payer_license,
        site_url,
        site_tel,
        site_name,
        provider_organization,
        payer_organization,
        payer_name,
        provider_location,
        location_license,
        payer_base_url: "",
        purpose: [message_event_type],
        coverage_type: undefined,
        coverage_id: undefined,
        member_id: memberid,
        patient_id: patientFileNo,
        national_id: iqama_no,
        staff_first_name: official_name,
        staff_family_name: official_f_name,
        gender: gender,
        birthdate: birthDate,
        patient_martial_status: undefined,
        relationship: undefined,
        period_start_date,
        period_end_date,
        business_arrangement: undefined,
        network_name: undefined,
        coverage_classes: undefined,
      });
      next();
    }
  });

  next();
};

export default createEligibilityMiddleware;
