/*
 *
 * Helper: `extractClaimResponseData`.
 *
 */
import {
  isArrayHasData,
  getLastPartOfUrl,
  formatDateToNativeDateParts,
} from "@exsys-web-server/helpers";
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";
import extractClaimResponseExtensions from "./extractClaimResponseExtensions.mjs";

const formatDate = (date, ignoreTime) =>
  formatDateToNativeDateParts(date, {
    stringifyReturnedDate: true,
    ignoreTime,
  });

const formatProductAdjudicationItem = (adjudicationItem) => {
  if (!adjudicationItem) {
    return {};
  }
  const { category, reason, amount, value: itemValue } = adjudicationItem;
  const { code } = extractNphiesCodeAndDisplayFromCodingType(category);
  const { currency, value } = amount || {};
  const { coding: reasonCoding } = reason || {};

  const _code = code.replace(/-/g, "_");

  return {
    [`${_code}_value`]:
      typeof itemValue === "number" || !!itemValue ? itemValue : value,
    [`${_code}_currency`]: currency,
    [`${_code}_reason`]: isArrayHasData(reasonCoding)
      ? reasonCoding.reduce((acc, { code, display }) => {
          const codeAndDisplay = [code, display].filter(Boolean).join(" - ");
          acc += `${acc ? ` / ` : ""}${codeAndDisplay}`;
          return acc;
        }, "")
      : undefined,
  };
};

const formatAdjudicationData = (adjudication) =>
  isArrayHasData(adjudication)
    ? adjudication.reduce(
        (acc, adjudicationItem) => ({
          ...acc,
          ...formatProductAdjudicationItem(adjudicationItem),
        }),
        {}
      )
    : null;

const formatProductsData = (products) =>
  isArrayHasData(products)
    ? products.map(
        ({ itemSequence, extension, adjudication, productOrService }) => {
          const { claimExtensionCode, extensionOthersValues } =
            extractClaimResponseExtensions(extension);

          return {
            sequence: itemSequence,
            status: claimExtensionCode,
            ...extensionOthersValues,
            ...extractProductOrServiceData(productOrService),
            ...formatAdjudicationData(adjudication),
          };
        }
      )
    : undefined;

const extractClaimResponseData = ({ entryGroupArray, isPollResponse }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    resourceType,
    id,
    extension,
    identifier,
    status,
    subType,
    type,
    use,
    created,
    outcome,
    disposition,
    preAuthRef,
    preAuthPeriod,
    item,
    processNote,
    error,
    request,
    fundsReserve,
    output,
    priority,
    insurer,
    requestor,
    total,
    addItem,
    payeeType,
  } = resource || {};

  const [claimResponseId] = extractIdentifierData(identifier);

  const { identifier: requestIdentifier } = request || {};
  const { value: requestIdentifierValue } = requestIdentifier || {};

  const claimRequestId = requestIdentifierValue
    ? requestIdentifierValue.replace("req_", "")
    : id;

  const { code: claimMessageEventType } =
    extractNphiesCodeAndDisplayFromCodingType(type);

  const { claimExtensionCode, extensionOthersValues } =
    extractClaimResponseExtensions(extension);

  const { code: fundsReserveCode } =
    extractNphiesCodeAndDisplayFromCodingType(fundsReserve);

  const { start, end } = preAuthPeriod || {};

  const processNotes = isArrayHasData(processNote)
    ? processNote.map(({ text, number }) => `${number}-${text}`).join(` , `)
    : undefined;

  const productsData = formatProductsData(item);
  const addProductsData = formatProductsData(addItem);

  const totalAdjudicationValues = formatAdjudicationData(total);

  const errors = [
    ...extractErrorsArray(error),
    ...extractNphiesOutputErrors(output),
  ].filter(Boolean);

  const { reference: requestorRef } = requestor || {};
  const { reference: insurerRef } = insurer || {};

  const claimIdentifier = claimResponseId.replace("req_", "");
  const baseResponseId = claimIdentifier || id;

  return {
    claimResourceType: resourceType,
    claimResponseId: isPollResponse
      ? baseResponseId
      : claimResponseId.includes("req_")
      ? id
      : baseResponseId,
    claimRequestId,
    claimMessageEventType,
    claimIdentifier,
    claimStatus: status,
    claimOutcome: outcome,
    created: formatDate(created),
    claimPeriodStart: start,
    claimPeriodEnd: end,
    claimPreauthRef: preAuthRef,
    claimPriority: priority,
    claimDisposition: disposition,
    claimUse: use,
    subType: extractNphiesCodeAndDisplayFromCodingType(subType).code,
    payeeType: extractNphiesCodeAndDisplayFromCodingType(payeeType).code,
    requesterOrganizationId: getLastPartOfUrl(requestorRef) || undefined,
    insurerOrganizationId: getLastPartOfUrl(insurerRef) || undefined,
    claimExtensionCode: !claimExtensionCode
      ? outcome === "queued"
        ? "pended"
        : outcome
      : claimExtensionCode,
    ...extensionOthersValues,
    processNotes: processNotes,
    fundsReserveCode,
    productsData,
    addProductsData,
    totalAdjudicationValues: totalAdjudicationValues || undefined,
    claimErrors: errors,
  };
};

export default extractClaimResponseData;

// {
//   claimResourceType: 'ClaimResponse',
//   claimResponseId: '6f14f3fc-80a7-4208-b72b-9d74666b29f0',
//   claimRequestId: 'e03aa37b-b328-4b4f-9936-601d9ba89c16',
//   claimMessageEventType: 'institutional',
//   claimStatus: 'active',
//   claimOutcome: 'complete',
//   created: '04-10-2024',
//   claimPeriodStart: '04-10-2024',
//   claimPeriodEnd: '09-10-2024',
//   claimPreauthRef: '68f8ad45-80f7-49bc-8f07-969475ad4eff',
//   claimPriority: undefined,
//   claimDisposition: undefined,
//   claimUse: 'preauthorization',
//   claimExtensionCode: 'approved',
//   processNotes: undefined,
//   productsData: [
//     {
//       sequence: 1,
//       status: 'approved',
//       eligible_value: 115,
//       eligible_currency: 'SAR',
//       eligible_reason: undefined,
//       copay_value: 18,
//       copay_currency: 'SAR',
//       copay_reason: undefined,
//       benefit_value: 97,
//       benefit_currency: 'SAR',
//       benefit_reason: undefined,
//       approved_quantity_value: 1,
//       approved_quantity_currency: undefined,
//       approved_quantity_reason: undefined
//     },
//     {
//       sequence: 2,
//       status: 'approved',
//       eligible_value: 115,
//       eligible_currency: 'SAR',
//       eligible_reason: undefined,
//       copay_value: 7,
//       copay_currency: 'SAR',
//       copay_reason: undefined,
//       benefit_value: 108,
//       benefit_currency: 'SAR',
//       benefit_reason: undefined,
//       approved_quantity_value: 1,
//       approved_quantity_currency: undefined,
//       approved_quantity_reason: undefined
//     }
//   ],
//   fundsReserveCode: undefined,
//   subType: 'ip',
//   requesterOrganizationId: '6',
//   insurerOrganizationId: 'INS-FHIR',
//   totalAdjudicationValues: {
//     eligible_value: 230,
//     eligible_currency: 'SAR',
//     eligible_reason: undefined,
//     benefit_value: 205,
//     benefit_currency: 'SAR',
//     benefit_reason: undefined,
//     copay_value: 25,
//     copay_currency: 'SAR',
//     copay_reason: undefined
//   },
//   claimErrors: []
// }

// console.log(
//   extractClaimResponseData({
//     entryGroupArray: [
//       {
//         fullUrl:
//           "http://pseudo-payer.com.sa/ClaimResponse/e03aa37b-b328-4b4f-9936-601d9ba89c16",
//         resource: {
//           resourceType: "ClaimResponse",
//           id: "e03aa37b-b328-4b4f-9936-601d9ba89c16",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/prior-auth-response|1.0.0",
//             ],
//           },
//           extension: [
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-adjudication-outcome",
//               valueCodeableConcept: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/adjudication-outcome",
//                     code: "approved",
//                   },
//                 ],
//               },
//             },
//           ],
//           identifier: [
//             {
//               system: "http://pseudo-payer.com.sa/claimresponse",
//               value: "6f14f3fc-80a7-4208-b72b-9d74666b29f0",
//             },
//           ],
//           status: "active",
//           type: {
//             coding: [
//               {
//                 system: "http://terminology.hl7.org/CodeSystem/claim-type",
//                 code: "institutional",
//               },
//             ],
//           },
//           subType: {
//             coding: [
//               {
//                 system: "http://nphies.sa/terminology/CodeSystem/claim-subtype",
//                 code: "ip",
//               },
//             ],
//           },
//           use: "preauthorization",
//           patient: {
//             reference: "http://provider.com/Patient/168833",
//           },
//           created: "2024-10-04",
//           insurer: {
//             reference: "http://provider.com/Organization/INS-FHIR",
//           },
//           requestor: {
//             reference: "http://provider.com/Organization/6",
//           },
//           request: {
//             type: "Claim",
//             identifier: {
//               system: "http://provider.com/authorization",
//               value: "req_e03aa37b-b328-4b4f-9936-601d9ba89c16",
//             },
//           },
//           outcome: "complete",
//           preAuthRef: "68f8ad45-80f7-49bc-8f07-969475ad4eff",
//           preAuthPeriod: {
//             start: "2024-10-04",
//             end: "2024-10-09",
//           },
//           item: [
//             {
//               extension: [
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-adjudication-outcome",
//                   valueCodeableConcept: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/adjudication-outcome",
//                         code: "approved",
//                       },
//                     ],
//                   },
//                 },
//               ],
//               itemSequence: 1,
//               adjudication: [
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://terminology.hl7.org/CodeSystem/adjudication",
//                         code: "eligible",
//                       },
//                     ],
//                   },
//                   amount: {
//                     value: 115,
//                     currency: "SAR",
//                   },
//                 },
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://terminology.hl7.org/CodeSystem/adjudication",
//                         code: "copay",
//                       },
//                     ],
//                   },
//                   amount: {
//                     value: 18,
//                     currency: "SAR",
//                   },
//                 },
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://terminology.hl7.org/CodeSystem/adjudication",
//                         code: "benefit",
//                       },
//                     ],
//                   },
//                   amount: {
//                     value: 97,
//                     currency: "SAR",
//                   },
//                 },
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/ksa-adjudication",
//                         code: "approved-quantity",
//                       },
//                     ],
//                   },
//                   value: 1,
//                 },
//               ],
//             },
//             {
//               extension: [
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-adjudication-outcome",
//                   valueCodeableConcept: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/adjudication-outcome",
//                         code: "approved",
//                       },
//                     ],
//                   },
//                 },
//               ],
//               itemSequence: 2,
//               adjudication: [
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://terminology.hl7.org/CodeSystem/adjudication",
//                         code: "eligible",
//                       },
//                     ],
//                   },
//                   amount: {
//                     value: 115,
//                     currency: "SAR",
//                   },
//                 },
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://terminology.hl7.org/CodeSystem/adjudication",
//                         code: "copay",
//                       },
//                     ],
//                   },
//                   amount: {
//                     value: 7,
//                     currency: "SAR",
//                   },
//                 },
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://terminology.hl7.org/CodeSystem/adjudication",
//                         code: "benefit",
//                       },
//                     ],
//                   },
//                   amount: {
//                     value: 108,
//                     currency: "SAR",
//                   },
//                 },
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/ksa-adjudication",
//                         code: "approved-quantity",
//                       },
//                     ],
//                   },
//                   value: 1,
//                 },
//               ],
//             },
//           ],
//           total: [
//             {
//               category: {
//                 coding: [
//                   {
//                     system:
//                       "http://terminology.hl7.org/CodeSystem/adjudication",
//                     code: "eligible",
//                   },
//                 ],
//               },
//               amount: {
//                 value: 230,
//                 currency: "SAR",
//               },
//             },
//             {
//               category: {
//                 coding: [
//                   {
//                     system:
//                       "http://terminology.hl7.org/CodeSystem/adjudication",
//                     code: "benefit",
//                   },
//                 ],
//               },
//               amount: {
//                 value: 205,
//                 currency: "SAR",
//               },
//             },
//             {
//               category: {
//                 coding: [
//                   {
//                     system:
//                       "http://terminology.hl7.org/CodeSystem/adjudication",
//                     code: "copay",
//                   },
//                 ],
//               },
//               amount: {
//                 value: 25,
//                 currency: "SAR",
//               },
//             },
//           ],
//           insurance: [
//             {
//               sequence: 1,
//               focal: true,
//               coverage: {
//                 reference:
//                   "http://provider.com/Coverage/e03aa37b-b328-4b4f-9936-601d9ba89c16",
//               },
//             },
//           ],
//         },
//       },
//     ],
//   })
// );

// --------------------------------
// for poll

// {
//   claimResourceType: 'ClaimResponse',
//   claimResponseId: '104810997-475308',
//   claimRequestId: '475308',
//   claimMessageEventType: 'professional',
//   claimStatus: 'active',
//   claimOutcome: 'complete',
//   created: '28-09-2024 15:24:39',
//   claimPeriodStart: '28-09-2024 00:00:00',
//   claimPeriodEnd: '28-10-2024 00:00:00',
//   claimPreauthRef: '1104810613',
//   claimPriority: undefined,
//   claimDisposition: undefined,
//   claimUse: 'preauthorization',
//   claimExtensionCode: 'approved',
//   extensionAdvancedauthReason: 'referral',
//   extensionNewborn: false,
//   extensionReferringprovider: undefined,
//   extensionServiceprovider: undefined,
//   extensionDiagnosis: undefined,
//   processNotes: undefined,
//   productsData: undefined,
//   addProductsData: [
//     {
//       nphiesProductCode: '99999-99-99',
//       nphiesProductName: undefined,
//       nphiesProductCodeType: 'procedures',
//       customerProductCode: '3',
//       customerProductName: 'Consultation Professor',
//       extensionPackage: false,
//       extensionSequence: 1,
//       extensionDiagnosisSequence: 1,
//       status: 'approved',
//       benefit_value: 11,
//       benefit_currency: 'SAR',
//       benefit_reason: undefined,
//       approved_quantity_value: 1,
//       approved_quantity_currency: undefined,
//       approved_quantity_reason: undefined
//     }
//   ],
//   fundsReserveCode: undefined,
//   subType: 'op',
//   requesterOrganizationId: '063964',
//   insurerOrganizationId: '533072',
//   totalAdjudicationValues: {
//     benefit_value: 11,
//     benefit_currency: 'SAR',
//     benefit_reason: undefined
//   },
//   claimErrors: []
// }
// console.log(
//   extractClaimResponseData({
//     isPollResponse: true,
//     entryGroupArray: [
//       {
//         fullUrl: "https://bupa.com.sa/ClaimResponse/475308",
//         resource: {
//           resourceType: "ClaimResponse",
//           id: "475308",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/advanced-authorization|1.0.0",
//             ],
//           },
//           extension: [
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-adjudication-outcome",
//               valueCodeableConcept: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/adjudication-outcome",
//                     code: "approved",
//                   },
//                 ],
//               },
//             },
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-advancedAuth-reason",
//               valueCodeableConcept: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/advancedAuth-reason",
//                     code: "referral",
//                   },
//                 ],
//               },
//             },
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-newborn",
//               valueBoolean: false,
//             },
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-referringProvider",
//               valueReference: {
//                 display: "Dr Al Saggaf Eye Clinic & Day Surgery",
//               },
//             },
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-serviceProvider",
//               valueReference: {
//                 reference: "http://provider.com/Organization/063964",
//               },
//             },
//             {
//               extension: [
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-diagnosis-sequence",
//                   valuePositiveInt: 1,
//                 },
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-diagnosis-diagnosisCodeableConcept",
//                   valueCodeableConcept: {
//                     coding: [
//                       {
//                         system: "http://hl7.org/fhir/sid/icd-10-am",
//                         code: "H18.1",
//                       },
//                     ],
//                   },
//                 },
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-diagnosis-type",
//                   valueCodeableConcept: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/diagnosis-type",
//                         code: "principal",
//                       },
//                     ],
//                   },
//                 },
//               ],
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-diagnosis",
//             },
//           ],
//           identifier: [
//             {
//               system: "https://bupa.com.sa/advanced-priorauth",
//               value: "104810997-475308",
//             },
//           ],
//           status: "active",
//           type: {
//             coding: [
//               {
//                 system: "http://terminology.hl7.org/CodeSystem/claim-type",
//                 code: "professional",
//               },
//             ],
//           },
//           subType: {
//             coding: [
//               {
//                 system: "http://nphies.sa/terminology/CodeSystem/claim-subtype",
//                 code: "op",
//               },
//             ],
//           },
//           use: "preauthorization",
//           patient: {
//             reference: "https://bupa.com.sa/Patient/644845",
//           },
//           created: "2024-09-28T15:24:39+03:00",
//           insurer: {
//             reference: "https://bupa.com.sa/Organization/533072",
//           },
//           requestor: {
//             reference: "http://provider.com/Organization/063964",
//           },
//           outcome: "complete",
//           preAuthRef: "1104810613",
//           preAuthPeriod: {
//             start: "2024-09-28T00:00:00+03:00",
//             end: "2024-10-28T00:00:00+03:00",
//           },
//           addItem: [
//             {
//               extension: [
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-adjudication-outcome",
//                   valueCodeableConcept: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/adjudication-outcome",
//                         code: "approved",
//                       },
//                     ],
//                   },
//                 },
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-package",
//                   valueBoolean: false,
//                 },
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-sequence",
//                   valuePositiveInt: 1,
//                 },
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-diagnosis-sequence",
//                   valuePositiveInt: 1,
//                 },
//               ],
//               productOrService: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/procedures",
//                     code: "99999-99-99",
//                   },
//                   {
//                     system:
//                       "http://provider.com/terminology/CodeSystem/procedures",
//                     code: "3",
//                     display: "Consultation Professor",
//                   },
//                 ],
//               },
//               adjudication: [
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://terminology.hl7.org/CodeSystem/adjudication",
//                         code: "benefit",
//                       },
//                     ],
//                   },
//                   amount: {
//                     value: 11,
//                     currency: "SAR",
//                   },
//                 },
//                 {
//                   category: {
//                     coding: [
//                       {
//                         system:
//                           "http://nphies.sa/terminology/CodeSystem/ksa-adjudication",
//                         code: "approved-quantity",
//                       },
//                     ],
//                   },
//                   value: 1,
//                 },
//               ],
//             },
//           ],
//           total: [
//             {
//               category: {
//                 coding: [
//                   {
//                     system:
//                       "http://terminology.hl7.org/CodeSystem/adjudication",
//                     code: "benefit",
//                   },
//                 ],
//               },
//               amount: {
//                 value: 11,
//                 currency: "SAR",
//               },
//             },
//           ],
//           insurance: [
//             {
//               sequence: 1,
//               focal: false,
//               coverage: {
//                 reference: "https://bupa.com.sa/Coverage/195724",
//               },
//             },
//           ],
//         },
//       },
//     ],
//   })
// );
