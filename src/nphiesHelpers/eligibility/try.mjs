import { writeFile } from "fs/promises";
import createNaphiesRequestFullData from "./index.mjs";
import createNphiesRequest from "../../helpers/createNphiesRequest.mjs";
import mapEntriesAndExtractNeededData from "../extraction/mapEntriesAndExtractNeededData.mjs";
import extractCoverageEligibilityEntryResponseData from "../extraction/extractCoverageEligibilityEntryResponseData.mjs";
import extractCoverageEntryResponseData from "../extraction/extractCoverageEntryResponseData.mjs";

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
  primaryKey: 21,
  data: {
    organization_no: "001",
    site_url: "http://provider.com",
    site_name: "Al Falah International Hospital",
    site_tel: "+966541413301",
    official_name: "Eyad",
    official_f_name: "Arnous",
    provider_license: "PR-FHIR",
    provider_organization: "6",
    provider_location: "2be11333-08ed-422a-9923-931c5a475f63",
    location_license: "GACH",
    payer_license: "INS-FHIR",
    payer_organization: "1",
    payer_name: "شركة ولا للتأمين التعاوني-الظهران",
    memberid: 1116201086,
    iqama_no: "1116201086",
    gender: "female",
    birthDate: "2002-01-01",
    period_start_date: "2023-06-19",
    period_end_date: "2023-06-20",
  },
};

const message_event_type = "validation";
const patientFileNo = "115765";

const nphiesDataCreatedFromExsysData = createNaphiesRequestFullData({
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
  payer_base_url: "http://payer.com",
  purpose:
    message_event_type === "validation"
      ? ["benefits", message_event_type]
      : [message_event_type],
  coverage_type: "EHCPOL",
  // coverage_type: undefined,
  coverage_id: "21",
  // coverage_id: undefined,
  // member_id: "5464554586",
  member_id: memberid,
  patient_id: patientFileNo,
  // national_id_type: "PRC"
  national_id: iqama_no,
  staff_first_name: official_name,
  staff_family_name: official_f_name,
  gender: gender,
  birthDate: birthDate,
  patient_martial_status: undefined,
  relationship: "self",
  // relationship: undefined,
  period_start_date,
  period_end_date,
  business_arrangement: undefined,
  network_name: undefined,
  // coverage_class_code = "group",
  coverage_class_value: undefined,
  coverage_class_name: undefined,
});

await writeFile(
  "./abc.json",
  JSON.stringify(nphiesDataCreatedFromExsysData, null, 2)
);

const nphiesResults = await createNphiesRequest({
  bodyData: nphiesDataCreatedFromExsysData,
});

let allResultData = {
  ...nphiesResults,
};

const { isSuccess, result: nphiesResponse } = nphiesResults;
if (isSuccess) {
  const extractedData = mapEntriesAndExtractNeededData(nphiesResponse, {
    CoverageEligibilityResponse: extractCoverageEligibilityEntryResponseData,
    Coverage: extractCoverageEntryResponseData,
  });

  allResultData.dataSentToExsys = {
    primaryKey: primaryKey,
    nodeServerDataSentToNaphies: nphiesDataCreatedFromExsysData,
    naphiesResponse: nphiesResponse,
    naphiesExtractedData: extractedData,
  };
}

await writeFile("./abc-result.json", JSON.stringify(allResultData, null, 2));

export {};

// {
//   "nafiesResponseData": {
//     "resourceType": "OperationOutcome",
//     "id": "82d5a8cd-cd9b-4ca3-acf7-d737676ef723",
//     "meta": {
//       "profile": "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/OperationOutcome|1.0.0"
//     },
//     "issue": [
//       {
//         "severity": "error",
//         "code": "exception",
//         "details": {
//           "coding": [
//             {
//               "code": "GE-00010",
//               "display": "The HIC/TPA you are trying to access is not onboarded/active on nphies",
//               "system": "http://nphies.sa/terminology/CodeSystem/adjudication-error"
//             }
//           ]
//         }
//       }
//     ]
//   },
//   "status": 503
// }
