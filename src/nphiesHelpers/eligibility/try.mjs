import createNaphiesRequestFullData from "./index.mjs";
import createNphiesRequest from "../../helpers/createNphiesRequest.mjs";
import writeResultFile from "../../nodeHelpers/writeResultFile.mjs";
import mapEntriesAndExtractNeededData from "../extraction/mapEntriesAndExtractNeededData.mjs";
import extractCoverageEligibilityEntryResponseData from "../extraction/extractCoverageEligibilityEntryResponseData.mjs";
import extractCoverageEntryResponseData from "../extraction/extractCoverageEntryResponseData.mjs";
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";
import { RETRY_DELAY, RETRY_TIMES } from "../../constants.mjs";

const message_event_type = "validation";
const patientFileNo = "115765";

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
  primaryKey: 43,
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
    period_start_date: "2023-06-20",
    period_end_date: "2023-06-21",
  },
};

const refreshNphiesDataCreatedFromExsysData = () =>
  createNaphiesRequestFullData({
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
    purpose: ["validation", "benefits"].includes(message_event_type)
      ? ["benefits", "validation"]
      : [message_event_type],
    // coverage_type: undefined,
    coverage_type: "EHCPOL",
    coverage_id: "20",
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
    classes: undefined,
  });

const callNphiesAPIAndPrintResults = async (
  nphiesDataCreatedFromExsysData,
  retryTimes
) => {
  // await writeResultFile(nphiesDataCreatedFromExsysData);

  const nphiesResults = await createNphiesRequest({
    bodyData: nphiesDataCreatedFromExsysData,
  });

  const { isSuccess, result: nphiesResponse, ...restResult } = nphiesResults;

  let allResultData = {
    isSuccess,
    ...restResult,
    primaryKey: primaryKey,
    nodeServerDataSentToNaphies: nphiesDataCreatedFromExsysData,
    nphiesResponse,
  };

  let shouldReloadApiDataCreation = false;
  if (isSuccess) {
    const extractedData = mapEntriesAndExtractNeededData(nphiesResponse, {
      CoverageEligibilityResponse: extractCoverageEligibilityEntryResponseData,
      Coverage: extractCoverageEntryResponseData,
    });

    allResultData.nphiesExtractedData = extractedData;

    if (extractedData) {
      const {
        CoverageEligibilityResponse: { errorCode, error },
      } = extractedData;
      // "errorCode": "GE-00012"
      // "error": "Payer is unreachable or temporarily offline, Please try again in a moment. If issue persists please follow up with the payer contact center."
      // "errorCode": "BV-00542"
      // "error": "NPHIES has already received and is currently processing a message for which this message is a duplicate",
      // "errorCode": "GE-00026"
      // "error": "The HIC unable to process your message, for more information please contact the payer.",

      shouldReloadApiDataCreation = [
        "GE-00012",
        "BV-00542",
        "GE-00026",
      ].includes(errorCode);

      if (shouldReloadApiDataCreation) {
        console.log(
          `----ReloadApiDataCreation---- in ${RETRY_DELAY / 1000} seconds`
        );
        console.log({
          primaryKey,
          errorCode,
          error,
        });
      }
    }
  }

  if (shouldReloadApiDataCreation && retryTimes > 0) {
    setTimeout(
      async () =>
        await callNphiesAPIAndPrintResults(
          nphiesDataCreatedFromExsysData,
          retryTimes - 1
        ),
      RETRY_DELAY
    );
    return;
  }

  // primary key issue
  // "error": "The main resource identifier SHALL be unique on the HCP/HIC level",
  // "errorCode": "BV-00163"
  if (!isSuccess) {
    const { issue } = nphiesResponse;
    allResultData = {
      ...allResultData,
      ...formatNphiesResponseIssue(issue),
    };
  }

  await writeResultFile(allResultData);
};

await callNphiesAPIAndPrintResults(
  refreshNphiesDataCreatedFromExsysData(),
  RETRY_TIMES
);
