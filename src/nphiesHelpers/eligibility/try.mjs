import { writeFile } from "fs/promises";
import createNaphiesRequestFullData from "./index.mjs";
import createNphiesRequest from "../../helpers/createNphiesRequest.mjs";

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
} = {
  primaryKey: 9,
  data: {
    organization_no: "001",
    site_url: "http://exsyssolutions.com",
    site_name: "Al Falah International Hospital",
    site_tel: "+966541413301",
    official_name: "Eyad",
    official_f_name: "Arnous",
    provider_license: "10000300103940",
    provider_organization: "10000300103940",
    provider_location: "2be11333-08ed-422a-9923-931c5a475f63",
    location_license: "GACH",
    payer_license: "INS-FHIR",
    payer_organization: "INS-FHIR",
    payer_name: "شركة ولا للتأمين التعاوني-الظهران",
    memberid: 1116201086,
    iqama_no: "1116201086",
    gender: "female",
    birthDate: "2002-01-01",
    period_start_date: "2023-06-14",
    period_end_date: "2023-06-15",
  },
};

const message_event_type = "validation";
const patientFileNo = "115765";

const result = createNaphiesRequestFullData({
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

await writeFile("./abc.json", JSON.stringify(result, null, 2));

const nphiesResults = await createNphiesRequest({
  bodyData: result,
});

await writeFile("./abc-result.json", JSON.stringify(nphiesResults, null, 2));

export {};
