import fetchExsysEligibilityDataAndCallNphies from "../../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";

const exsysAPiBodyData = {
  authorization: 5361687,
  message_event: "eligibility",
  message_event_type: "validation",
  organization_no: "001",
  patient_file_no: "115765",
  memberid: "1116201086",
  contract_no: 16529,
};

await fetchExsysEligibilityDataAndCallNphies({
  exsysAPiBodyData,
});

// const getNphiesDataCreatedFromExsysData = () => {
//   const requestId = createUUID();

//   return createNaphiesRequestFullData({
//     provider_license,
//     request_id: requestId,
//     payer_license,
//     site_url,
//     site_tel,
//     site_name,
//     provider_organization,
//     payer_organization,
//     payer_name,
//     provider_location,
//     location_license,
//     payer_base_url: "http://payer.com",
//     purpose: ["validation", "benefits"].includes(message_event_type)
//       ? ["benefits", "validation"]
//       : [message_event_type],
//     // coverage_type: undefined,
//     coverage_type: "EHCPOL",
//     coverage_id: requestId,
//     // coverage_id: undefined,
//     // member_id: "5464554586",
//     member_id: memberid,
//     patient_id: patientFileNo,
//     // national_id_type: "PRC"
//     national_id: iqama_no,
//     staff_first_name: official_name,
//     staff_family_name: official_f_name,
//     gender: gender,
//     birthDate: birthDate,
//     patient_martial_status: undefined,
//     relationship: "self",
//     // relationship: undefined,
//     period_start_date,
//     period_end_date,
//     business_arrangement: undefined,
//     network_name: undefined,
//     classes: undefined,
//   });
// };

// const callNphiesAPIAndPrintResults = async (
//   nphiesDataCreatedFromExsysData,
//   retryTimes
// ) => {
//   const nphiesResults = await createNphiesRequest({
//     bodyData: nphiesDataCreatedFromExsysData,
//   });

//   const { isSuccess, result: nphiesResponse, ...restResult } = nphiesResults;

//   let allResultData = {
//     isSuccess,
//     ...restResult,
//     primaryKey,
//     nodeServerDataSentToNaphies: nphiesDataCreatedFromExsysData,
//     nphiesResponse,
//   };

//   let shouldReloadApiDataCreation = false;
//   if (isSuccess) {
//     const extractedData = mapEntriesAndExtractNeededData(nphiesResponse, {
//       CoverageEligibilityResponse: extractCoverageEligibilityEntryResponseData,
//       Coverage: extractCoverageEntryResponseData,
//     });

//     allResultData.nphiesExtractedData = extractedData;

//     if (extractedData) {
//       const {
//         CoverageEligibilityResponse: { errorCode, error },
//       } = extractedData;
//       // "errorCode": "GE-00012"
//       // "error": "Payer is unreachable or temporarily offline, Please try again in a moment. If issue persists please follow up with the payer contact center."
//       // "errorCode": "BV-00542"
//       // "error": "NPHIES has already received and is currently processing a message for which this message is a duplicate",
//       // "errorCode": "GE-00026"
//       // "error": "The HIC unable to process your message, for more information please contact the payer.",
//       // "errorCode": "BV-00163"
//       // "error": "The main resource identifier SHALL be unique on the HCP/HIC level",
//       shouldReloadApiDataCreation = [
//         "GE-00012",
//         "BV-00542",
//         "GE-00026",
//         "BV-00163",
//       ].includes(errorCode);

//       if (shouldReloadApiDataCreation) {
//         console.log(
//           `----ReloadApiDataCreation---- in ${RETRY_DELAY / 1000} seconds`
//         );
//         console.log({
//           primaryKey,
//           errorCode,
//           error,
//         });
//       }
//     }
//   }

//   if (shouldReloadApiDataCreation && retryTimes > 0) {
//     setTimeout(
//       async () =>
//         await callNphiesAPIAndPrintResults(
//           nphiesDataCreatedFromExsysData,
//           retryTimes - 1
//         ),
//       RETRY_DELAY
//     );
//     return;
//   }

//   if (!isSuccess) {
//     const { issue } = nphiesResponse;
//     allResultData = {
//       ...allResultData,
//       ...formatNphiesResponseIssue(issue),
//     };
//   }

//   await writeResultFile(allResultData);
// };

// await callNphiesAPIAndPrintResults(
//   getNphiesDataCreatedFromExsysData(),
//   RETRY_TIMES
// );
