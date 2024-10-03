/*
 *
 * Helper: `extractEligibilityResponseData`.
 *
 */
import {
  createDateFromNativeDate,
  getLastPartOfUrl,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractInsurancesData from "./extractInsurancesData.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";

const dateOptions = {
  returnReversedDate: false,
};

const getDatTime = (date) => {
  const { dateString, time } = createDateFromNativeDate(date, dateOptions);
  return [dateString, time].filter(Boolean).join(" ");
};

const extractEligibilityResponseData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    resourceType,
    id,
    outcome,
    disposition,
    servicedPeriod,
    identifier,
    status,
    error,
    extension,
    insurance,
    created,
    requestor,
    insurer,
    purpose,
  } = resource;

  const { start, end } = servicedPeriod || {};
  const [value, system] = extractIdentifierData(identifier);
  const [{ valueCodeableConcept }] = extension || [{}];
  const { code: valueCodeableConceptCode } =
    extractNphiesCodeAndDisplayFromCodingType(valueCodeableConcept);

  const errors = extractErrorsArray(error);

  const isPatientEligible =
    outcome === "complete" &&
    status === "active" &&
    valueCodeableConceptCode === "eligible";

  const { reference: requestorRef } = requestor || {};
  const { reference: insurerRef } = insurer || {};

  return {
    eligibilityResourceType: resourceType,
    eligibilityResponseId: id,
    eligibilityStatus: status,
    eligibilityOutcome: outcome,
    eligibilityDisposition: `${
      valueCodeableConceptCode
        ? `site eligibility (${valueCodeableConceptCode})`
        : ""
    }${disposition ? ` - ${disposition}` : ""}`,
    eligibilityCreated: getDatTime(created),
    eligibilityPeriodStart: getDatTime(start),
    eligibilityPeriodEnd: getDatTime(end),
    eligibilityPayerClaimResponseUrl: system,
    eligibilityClaimResponse: value,
    eligibilityRequesterOrganizationId: getLastPartOfUrl(requestorRef),
    eligibilityInsurerOrganizationId: getLastPartOfUrl(insurerRef),
    insuranceBenefits: extractInsurancesData(insurance),
    isPatientEligible: isPatientEligible ? "Y" : "N",
    eligibilityErrors: errors,
    purpose: isArrayHasData(purpose) ? purpose.join(", ") : undefined,
  };
};

export default extractEligibilityResponseData;

// {
//   eligibilityResourceType: 'CoverageEligibilityResponse',
//   eligibilityResponseId: '4856db6c-aa20-41f4-9463-c70eb22ced87',
//   eligibilityStatus: 'active',
//   eligibilityOutcome: 'error',
//   eligibilityDisposition: 'site eligibility (out-network) - Member ID is invalid',
//   eligibilityCreated: '25-09-2024 19:19:36 pm',
//   eligibilityPeriodStart: '25-09-2024 02:00:00 am',
//   eligibilityPeriodEnd: '26-09-2024 02:00:00 am',
//   eligibilityPayerClaimResponseUrl: 'https://bupa.com.sa/CoverageEligibilityResponse',
//   eligibilityClaimResponse: '4856db6c-aa20-41f4-9463-c70eb22ced87',
//   eligibilityRequesterOrganizationId: '6',
//   eligibilityInsurerOrganizationId: '7001571327',
//   eligibilityInsuranceBenefits: undefined,
//   isPatientEligible: 'N',
//   eligibilityErrors: [ { error: '', errorCode: '1680' } ]
// }
// console.log(
//   extractEligibilityResponseData({
//     entryGroupArray: [
//       {
//         fullUrl:
//           "https://bupa.com.sa/CoverageEligibilityResponse/4856db6c-aa20-41f4-9463-c70eb22ced87",
//         resource: {
//           resourceType: "CoverageEligibilityResponse",
//           id: "4856db6c-aa20-41f4-9463-c70eb22ced87",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/eligibility-response|1.0.0",
//             ],
//           },
//           extension: [
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-siteEligibility",
//               valueCodeableConcept: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/siteEligibility",
//                     code: "out-network",
//                     display: "Member ID is invalid",
//                   },
//                 ],
//               },
//             },
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-not-in-force-reason",
//               valueCodeableConcept: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/not-in-force-reason",
//                     code: "NC",
//                   },
//                 ],
//               },
//             },
//           ],
//           identifier: [
//             {
//               system: "https://bupa.com.sa/CoverageEligibilityResponse",
//               value: "4856db6c-aa20-41f4-9463-c70eb22ced87",
//             },
//           ],
//           status: "active",
//           purpose: ["benefits", "validation"],
//           patient: {
//             reference: "https://bupa.com.sa/Patient/237589",
//           },
//           servicedPeriod: {
//             start: "2024-09-25",
//             end: "2024-09-26",
//           },
//           created: "2024-09-25T20:19:36+03:00",
//           requestor: {
//             reference: "http://exsyssolutions.com/Organization/6",
//           },
//           request: {
//             type: "CoverageEligibilityRequest",
//             identifier: {
//               system: "http://exsyssolutions.com/CoverageEligibilityRequest",
//               value: "req_d62b409e-4310-4f54-a313-fa8c49d198f0",
//             },
//           },
//           outcome: "error",
//           disposition: "Member ID is invalid",
//           insurer: {
//             reference: "http://exsyssolutions.com/Organization/7001571327",
//           },
//           error: [
//             {
//               code: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/adjudication-error",
//                     code: "1680",
//                   },
//                 ],
//               },
//             },
//           ],
//         },
//       },
//     ],
//   })
// );
