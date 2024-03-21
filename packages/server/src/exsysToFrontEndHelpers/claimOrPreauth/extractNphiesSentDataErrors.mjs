/*
 *
 * Helper: `extractNphiesSentDataErrors`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import getValueIndexFromString from "../../helpers/getValueIndexFromString.mjs";
import getEntriesResourceIndicesMap from "../../nphiesHelpers/base/getEntriesResourceIndicesMap.mjs";

const createAssignErrorToObjectError =
  ({ error, errorCode }) =>
  (matchWith, errorObject) => {
    if (error) {
      const index = getValueIndexFromString(error, matchWith);

      const mainErrorRegexp = new RegExp(
        `bundle.+${matchWith}\\[\\d{0,}\\].`,
        "gmi"
      );
      const mainError = error.replace(mainErrorRegexp, "");

      if (index) {
        const sequence = +index + 1;

        const previousSequenceError = errorObject[sequence];

        errorObject[sequence] = [
          previousSequenceError,
          [mainError, errorCode].filter(Boolean).join(" => "),
        ]
          .filter(Boolean)
          .join("\n");

        return errorObject;
      }
    }

    return errorObject;
  };

const extractNphiesSentDataErrors = (
  nodeServerDataSentToNphies,
  claimErrors
) => {
  const entriesResourceIndicesMap = getEntriesResourceIndicesMap(
    nodeServerDataSentToNphies
  );

  let productErrors = {};
  let diagnosisErrors = {};
  let supportInfoErrors = {};
  let otherClaimErrors = [];

  if (isArrayHasData(claimErrors)) {
    claimErrors.forEach((errorData) => {
      const { error, errorCode } = errorData;

      const bundleEntryIndex = getValueIndexFromString(error, "Bundle.entry");
      const entryResourceType = entriesResourceIndicesMap[bundleEntryIndex];

      const _error = [
        entryResourceType && `In (${entryResourceType}) entry`,
        error,
      ]
        .filter(Boolean)
        .join(" => ");

      const currentErrorData = {
        error: _error,
        errorCode,
      };

      const assignErrorToObjectError =
        createAssignErrorToObjectError(currentErrorData);

      const hasItem = error.includes("resource.item[");
      const hasSupportInfo = error.includes("resource.supportingInfo[");
      const hasDiagnosis = error.includes("resource.diagnosis[");

      if (hasItem) {
        productErrors = assignErrorToObjectError("item", productErrors);
      }

      if (hasSupportInfo) {
        supportInfoErrors = assignErrorToObjectError(
          "supportingInfo",
          supportInfoErrors
        );
      }

      if (hasDiagnosis) {
        diagnosisErrors = assignErrorToObjectError(
          "diagnosis",
          diagnosisErrors
        );
      }

      if (!hasItem && !hasSupportInfo && !hasDiagnosis) {
        otherClaimErrors.push(currentErrorData);
      }
    });
  }

  return {
    productErrors,
    diagnosisErrors,
    supportInfoErrors,
    otherClaimErrors,
  };
};

export default extractNphiesSentDataErrors;

// const claimErrors = [
//   {
//     error:
//       "Bundle.entry[1].resource.supportingInfo[11].valueAttachment.data / Resource SHALL have a valid structure",
//     errorCode: "GE-00013",
//   },
//   {
//     error: "Bundle.entry[4].resource.some info[11]",
//     errorCode: "GE-00013",
//   },
// ];

// console.log(
//   extractNphiesSentDataErrors(
//     {
//       resourceType: "Bundle",
//       id: "4f496acb-418e-426b-8a9a-4787f77225e0",
//       meta: {
//         profile: [
//           "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0",
//         ],
//       },
//       type: "message",
//       timestamp: "2024-03-15T18:59:10.941Z",
//       entry: [
//         {
//           fullUrl: "urn:uuid:f87ad6c4-1584-4460-8f32-e9a578182f9c",
//           resource: {
//             resourceType: "MessageHeader",
//             id: "f87ad6c4-1584-4460-8f32-e9a578182f9c",
//             meta: {
//               profile: [
//                 "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/message-header|1.0.0",
//               ],
//             },
//             eventCoding: {
//               system:
//                 "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
//               code: "priorauth-request",
//             },
//             destination: [
//               {
//                 endpoint: "http://nphies.sa/license/payer-license/7001571327",
//                 receiver: {
//                   type: "Organization",
//                   identifier: {
//                     system: "http://nphies.sa/license/payer-license",
//                     value: "7001571327",
//                   },
//                 },
//               },
//             ],
//             sender: {
//               type: "Organization",
//               identifier: {
//                 system: "http://nphies.sa/license/provider-license",
//                 value: "10000300085808",
//               },
//             },
//             source: {
//               endpoint: "http://nphies.sa/license/payer-license/10000300085808",
//             },
//             focus: [
//               {
//                 reference:
//                   "http://exsyssolutions.com/Claim/831a6751-0fd4-4956-84f6-b8851406222e",
//               },
//             ],
//           },
//         },
//         {
//           fullUrl:
//             "http://exsyssolutions.com/Claim/831a6751-0fd4-4956-84f6-b8851406222e",
//           resource: {
//             resourceType: "Claim",
//             id: "831a6751-0fd4-4956-84f6-b8851406222e",
//             meta: {
//               profile: [
//                 "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/oral-priorauth|1.0.0",
//               ],
//             },
//             extension: [
//               {
//                 url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-authorization-offline-date",
//                 valueDateTime: "2024-03-15",
//               },
//             ],
//             identifier: [
//               {
//                 system: "http://exsyssolutions.com/authorization",
//                 value: "req_831a6751-0fd4-4956-84f6-b8851406222e",
//               },
//             ],
//             status: "active",
//             patient: {
//               reference: "http://exsyssolutions.com/Patient/5359098",
//             },
//             created: "2024-03-15",
//             insurer: {
//               reference: "http://exsyssolutions.com/Organization/7001571327",
//             },
//             provider: {
//               reference: "http://exsyssolutions.com/Organization/6",
//             },
//             priority: {
//               coding: [
//                 {
//                   system:
//                     "http://terminology.hl7.org/CodeSystem/processpriority",
//                   code: "normal",
//                 },
//               ],
//             },
//             insurance: [
//               {
//                 sequence: 1,
//                 focal: true,
//                 coverage: {
//                   reference:
//                     "http://exsyssolutions.com/Coverage/831a6751-0fd4-4956-84f6-b8851406222e",
//                 },
//               },
//             ],
//             type: {
//               coding: [
//                 {
//                   system: "http://terminology.hl7.org/CodeSystem/claim-type",
//                   code: "oral",
//                 },
//               ],
//             },
//             subType: {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/claim-subtype",
//                   code: "op",
//                 },
//               ],
//             },
//             use: "preauthorization",
//             payee: {
//               type: {
//                 coding: [
//                   {
//                     system: "http://terminology.hl7.org/CodeSystem/payeetype",
//                     code: "provider",
//                   },
//                 ],
//               },
//             },
//             careTeam: [
//               {
//                 sequence: 1,
//                 provider: {
//                   reference: "http://exsyssolutions.com/Practitioner/21292",
//                 },
//                 role: {
//                   coding: [
//                     {
//                       system:
//                         "http://terminology.hl7.org/CodeSystem/claimcareteamrole",
//                       code: "primary",
//                     },
//                   ],
//                 },
//                 qualification: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/practice-codes",
//                       code: "22.00",
//                     },
//                   ],
//                 },
//               },
//             ],
//             supportingInfo: [
//               {
//                 sequence: 1,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "vital-sign-systolic",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 120,
//                   system: "http://unitsofmeasure.org",
//                   code: "mm[Hg]",
//                 },
//               },
//               {
//                 sequence: 2,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "vital-sign-diastolic",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 80,
//                   system: "http://unitsofmeasure.org",
//                   code: "mm[Hg]",
//                 },
//               },
//               {
//                 sequence: 3,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "vital-sign-height",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 160,
//                   system: "http://unitsofmeasure.org",
//                   code: "cm",
//                 },
//               },
//               {
//                 sequence: 4,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "vital-sign-weight",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 70,
//                   system: "http://unitsofmeasure.org",
//                   code: "kg",
//                 },
//               },
//               {
//                 sequence: 5,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "temperature",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 37,
//                   system: "http://unitsofmeasure.org",
//                   code: "Cel",
//                 },
//               },
//               {
//                 sequence: 6,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "oxygen-saturation",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 99,
//                   system: "http://unitsofmeasure.org",
//                   code: "%",
//                 },
//               },
//               {
//                 sequence: 7,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "respiratory-rate",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 20,
//                   system: "http://unitsofmeasure.org",
//                   code: "/min",
//                 },
//               },
//               {
//                 sequence: 8,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "pulse",
//                     },
//                   ],
//                 },
//                 valueQuantity: {
//                   value: 80,
//                   system: "http://unitsofmeasure.org",
//                   code: "/min",
//                 },
//               },
//               {
//                 sequence: 9,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "reason-for-visit",
//                     },
//                   ],
//                 },
//                 code: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/visit-reason",
//                       code: "new-visit",
//                       display: "New Visit",
//                     },
//                   ],
//                 },
//               },
//               {
//                 sequence: 10,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "chief-complaint",
//                     },
//                   ],
//                 },
//                 code: {
//                   coding: [
//                     {
//                       system: "http://hl7.org/fhir/sid/icd-10-am",
//                       code: "K04",
//                       display: "Diseases of pulp and periapical tissues",
//                     },
//                   ],
//                   text: "   TOOTH  PAIN",
//                 },
//               },
//               {
//                 sequence: 11,
//                 category: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/claim-information-category",
//                       code: "info",
//                     },
//                   ],
//                 },
//                 code: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/info-reason",
//                       code: "Missing-info",
//                       display: "Signs Symptoms",
//                     },
//                   ],
//                 },
//                 valueString: " ABSCESS",
//               },
//             ],
//             diagnosis: [
//               {
//                 sequence: 1,
//                 diagnosisCodeableConcept: {
//                   coding: [
//                     {
//                       system: "http://hl7.org/fhir/sid/icd-10-am",
//                       code: "K04",
//                       display: "Diseases of pulp and periapical tissues",
//                     },
//                   ],
//                 },
//                 type: [
//                   {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/diagnosis-type",
//                         code: "principal",
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//             item: [
//               {
//                 sequence: 1,
//                 careTeamSequence: [1],
//                 diagnosisSequence: [1],
//                 informationSequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
//                 extension: [
//                   {
//                     url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-tax",
//                     valueMoney: {
//                       value: 7.18,
//                       currency: "SAR",
//                     },
//                   },
//                   {
//                     url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-patient-share",
//                     valueMoney: {
//                       value: 0,
//                       currency: "SAR",
//                     },
//                   },
//                   {
//                     url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-package",
//                     valueBoolean: false,
//                   },
//                 ],
//                 productOrService: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/procedures",
//                       code: "96199-19-00",
//                       display: "IV admin of pharmac agt oth & unsp agent",
//                     },
//                     {
//                       system: "http://exsyssolutions.com/procedures",
//                       code: "3006222294",
//                       display: "XEFO 8MG Powder for injection",
//                     },
//                   ],
//                 },
//                 servicedDate: "2024-03-15",
//                 quantity: {
//                   value: 3,
//                 },
//                 unitPrice: {
//                   value: 15.95,
//                   currency: "SAR",
//                 },
//                 factor: 1,
//                 net: {
//                   value: 55.03,
//                   currency: "SAR",
//                 },
//               },
//               {
//                 sequence: 2,
//                 careTeamSequence: [1],
//                 diagnosisSequence: [1],
//                 informationSequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
//                 extension: [
//                   {
//                     url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-tax",
//                     valueMoney: {
//                       value: 13.75,
//                       currency: "SAR",
//                     },
//                   },
//                   {
//                     url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-patient-share",
//                     valueMoney: {
//                       value: 0,
//                       currency: "SAR",
//                     },
//                   },
//                   {
//                     url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-package",
//                     valueBoolean: false,
//                   },
//                 ],
//                 productOrService: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/procedures",
//                       code: "96199-19-00",
//                       display: "IV admin of pharmac agt oth & unsp agent",
//                     },
//                     {
//                       system: "http://exsyssolutions.com/procedures",
//                       code: "119-172-98",
//                       display: "SAMIXON 1GM VIAL",
//                     },
//                   ],
//                 },
//                 servicedDate: "2024-03-15",
//                 quantity: {
//                   value: 3,
//                 },
//                 unitPrice: {
//                   value: 30.55,
//                   currency: "SAR",
//                 },
//                 factor: 1,
//                 net: {
//                   value: 105.4,
//                   currency: "SAR",
//                 },
//               },
//             ],
//             total: {
//               value: 160.43,
//               currency: "SAR",
//             },
//           },
//         },
//         {
//           fullUrl: "http://exsyssolutions.com/Patient/5359098",
//           resource: {
//             resourceType: "Patient",
//             id: "5359098",
//             meta: {
//               profile: [
//                 "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/patient|1.0.0",
//               ],
//             },
//             identifier: [
//               {
//                 type: {
//                   coding: [
//                     {
//                       system: "http://terminology.hl7.org/CodeSystem/v2-0203",
//                       code: "PRC",
//                       display: "iqama",
//                     },
//                   ],
//                 },
//                 system: "http://nphies.sa/identifier/iqama",
//                 value: "2505962437",
//               },
//             ],
//             active: true,
//             name: [
//               {
//                 given: ["Hossam", "Mustafa", "Mahrous", "Abdualhakem"],
//                 text: "Hossam Mustafa Mahrous Abdualhakem",
//                 family: "Abdualhakem",
//                 use: "official",
//               },
//             ],
//             telecom: [
//               {
//                 system: "phone",
//                 value: "0567428479",
//               },
//             ],
//             gender: "male",
//             _gender: {
//               extension: [
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-ksa-administrative-gender",
//                   valueCodeableConcept: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/ksa-administrative-gender",
//                         code: "male",
//                         display: "Male",
//                       },
//                     ],
//                   },
//                 },
//               ],
//             },
//             birthDate: "1994-12-12",
//           },
//         },
//         {
//           fullUrl:
//             "http://exsyssolutions.com/Coverage/831a6751-0fd4-4956-84f6-b8851406222e",
//           resource: {
//             resourceType: "Coverage",
//             id: "831a6751-0fd4-4956-84f6-b8851406222e",
//             meta: {
//               profile: [
//                 "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/coverage|1.0.0",
//               ],
//             },
//             identifier: [
//               {
//                 system: "http://payer.com/memberid",
//                 value: "31501895",
//               },
//             ],
//             status: "active",
//             type: {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/coverage-type",
//                   code: "EHCPOL",
//                 },
//               ],
//             },
//             subscriber: {
//               reference: "http://exsyssolutions.com/Patient/5359098",
//             },
//             beneficiary: {
//               reference: "http://exsyssolutions.com/Patient/5359098",
//             },
//             relationship: {
//               coding: [
//                 {
//                   system:
//                     "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
//                   code: "self",
//                   display: "Self",
//                 },
//               ],
//             },
//             payor: [
//               {
//                 reference: "http://exsyssolutions.com/Organization/7001571327",
//               },
//             ],
//           },
//         },
//         {
//           fullUrl: "http://exsyssolutions.com/Practitioner/21292",
//           resource: {
//             resourceType: "Practitioner",
//             id: "21292",
//             meta: {
//               profile: [
//                 "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/practitioner|1.0.0",
//               ],
//             },
//             identifier: [
//               {
//                 type: {
//                   coding: [
//                     {
//                       system: "http://terminology.hl7.org/CodeSystem/v2-0203",
//                       code: "MD",
//                     },
//                   ],
//                 },
//                 system: "http://nphies.sa/license/practitioner-license",
//                 value: "3800242949",
//               },
//             ],
//             active: true,
//             name: [
//               {
//                 given: ["Dr.Mohammed", "Atif", "Bakhri", "Sabony"],
//                 text: "Dr.Mohammed Atif Bakhri Sabony",
//                 family: "Sabony",
//                 use: "official",
//               },
//             ],
//           },
//         },
//         {
//           fullUrl: "http://exsyssolutions.com/Organization/6",
//           resource: {
//             resourceType: "Organization",
//             id: "6",
//             meta: {
//               profile: [
//                 "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/provider-organization|1.0.0",
//               ],
//             },
//             identifier: [
//               {
//                 system: "http://nphies.sa/license/provider-license",
//                 value: "10000300085808",
//               },
//             ],
//             active: true,
//             type: [
//               {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/organization-type",
//                     code: "prov",
//                   },
//                 ],
//               },
//             ],
//             name: "Dammam National Medical Company",
//           },
//         },
//         {
//           fullUrl: "http://exsyssolutions.com/Organization/7001571327",
//           resource: {
//             resourceType: "Organization",
//             id: "7001571327",
//             meta: {
//               profile: [
//                 "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/insurer-organization|1.0.0",
//               ],
//             },
//             identifier: [
//               {
//                 system: "http://nphies.sa/license/payer-license",
//                 value: "7001571327",
//               },
//             ],
//             active: true,
//             type: [
//               {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/organization-type",
//                     code: "ins",
//                   },
//                 ],
//               },
//             ],
//             name: "BUPA",
//           },
//         },
//       ],
//     },
//     claimErrors
//   )
// );
