/*
 *
 * Helper: `extractEligibilityRequestData`.
 *
 */
import {
  formatDateToNativeDateParts,
  getLastPartOfUrl,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const dateOptions = {
  stringifyReturnedDate: true,
};

const extractEligibilityRequestData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const { priority, created, purpose, id, servicedPeriod, insurer, provider } =
    resource || {};

  const { start, end } = servicedPeriod || {};

  const { reference: insurerRef } = insurer || {};
  const { reference: providerRef } = provider || {};

  return {
    requestId: id,
    created: formatDateToNativeDateParts(created, dateOptions),
    priority: extractNphiesCodeAndDisplayFromCodingType(priority).code,
    purpose: purpose.join(", "),
    insurerId: getLastPartOfUrl(insurerRef),
    providerId: getLastPartOfUrl(providerRef),
    servicedPeriod: [start, end].filter(Boolean).join(" ~ "),
  };
};

export default extractEligibilityRequestData;

// {
//   requestId: 'd62b409e-4310-4f54-a313-fa8c49d198f0',
//   created: '25-09-2024',
//   priority: 'normal',
//   purpose: 'benefits, validation',
//   insurerId: '7001571327',
//   providerId: '6',
//   servicedPeriod: '25-09-2024 ~ 26-09-2024'
// }
// console.log(
//   extractEligibilityRequestData({
//     entryGroupArray: [
//       {
//         fullUrl:
//           "http://exsyssolutions.com/CoverageEligibilityRequest/d62b409e-4310-4f54-a313-fa8c49d198f0",
//         resource: {
//           resourceType: "CoverageEligibilityRequest",
//           id: "d62b409e-4310-4f54-a313-fa8c49d198f0",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/eligibility-request|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               system: "http://exsyssolutions.com/CoverageEligibilityRequest",
//               value: "req_d62b409e-4310-4f54-a313-fa8c49d198f0",
//             },
//           ],
//           status: "active",
//           patient: {
//             reference: "http://exsyssolutions.com/Patient/237589",
//           },
//           created: "2024-09-25",
//           insurer: {
//             reference: "http://exsyssolutions.com/Organization/7001571327",
//           },
//           provider: {
//             reference: "http://exsyssolutions.com/Organization/6",
//           },
//           priority: {
//             coding: [
//               {
//                 system: "http://terminology.hl7.org/CodeSystem/processpriority",
//                 code: "normal",
//               },
//             ],
//           },
//           insurance: [
//             {
//               coverage: {
//                 reference:
//                   "http://exsyssolutions.com/Coverage/d62b409e-4310-4f54-a313-fa8c49d198f0",
//               },
//             },
//           ],
//           purpose: ["benefits", "validation"],
//           servicedPeriod: {
//             start: "2024-09-25",
//             end: "2024-09-26",
//           },
//           facility: {
//             reference:
//               "http://exsyssolutions.com/Location/2be11333-08ed-422a-9923-931c5a475f63",
//           },
//         },
//       },
//     ],
//   })
// );
