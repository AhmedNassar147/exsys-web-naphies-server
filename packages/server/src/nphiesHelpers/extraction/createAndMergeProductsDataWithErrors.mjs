/*
 *
 * Helper: `createAndMergeProductsDataWithErrors`.
 *
 */
import {
  formatDateToNativeDateParts,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import getValueFromObject from "./getValueFromObject.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";
import extractExtensionsSentToNphies from "./extractExtensionsSentToNphies.mjs";

const createAndMergeProductsDataWithErrors = ({
  extractedProductsData,
  productsSentToNphies,
  productErrors,
}) => {
  let productsData = undefined;

  const groupedExtractedProductsDataBySequence = isArrayHasData(
    extractedProductsData
  )
    ? extractedProductsData.reduce((acc, { sequence, ...otherValues }) => {
        acc[sequence] = otherValues;
        return acc;
      }, {})
    : {};

  if (isArrayHasData(productsSentToNphies)) {
    productsData = productsSentToNphies.map(
      ({
        sequence,
        extension,
        productOrService,
        quantity,
        unitPrice,
        factor,
        net,
        servicedDate,
        bodySite,
      }) => ({
        sequence,
        ...extractProductOrServiceData(productOrService),
        servicedDate: formatDateToNativeDateParts(servicedDate, {
          stringifyReturnedDate: true,
        }),
        quantity: getValueFromObject(quantity),
        unitPrice: getValueFromObject(unitPrice),
        ...extractExtensionsSentToNphies(extension),
        net_price: getValueFromObject(net),
        factor,
        tooth: extractNphiesCodeAndDisplayFromCodingType(bodySite).code,
        error: productErrors ? productErrors[sequence] : undefined,
        ...(groupedExtractedProductsDataBySequence[sequence] || null),
        extendable: "y",
      })
    );
  }

  const totalValues = isArrayHasData(productsData)
    ? productsData.reduce(
        (acc, { extensionTax, extensionPatientShare }) => {
          acc.totalTax = acc.totalTax + (extensionTax || 0);
          return {
            totalTax: acc.totalTax + (extensionTax || 0),
            totalPatientShare:
              acc.totalPatientShare + (extensionPatientShare || 0),
          };
        },
        {
          totalTax: 0,
          totalPatientShare: 0,
        }
      )
    : {};

  return { productsData, totalValues };
};

export default createAndMergeProductsDataWithErrors;

// console.log(
//   createAndMergeProductsDataWithErrors({
//     productErrors: [],
//     productsSentToNphies: [
//       {
//         sequence: 1,
//         careTeamSequence: [1],
//         diagnosisSequence: [1],
//         informationSequence: [
//           1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
//         ],
//         extension: [
//           {
//             url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-package",
//             valueBoolean: false,
//           },
//           {
//             url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-pharmacist-Selection-Reason",
//             valueCodeableConcept: {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/pharmacist-selection-reason",
//                   code: "innovative-noGeneric",
//                   display: "innovative-noGeneric",
//                 },
//               ],
//             },
//           },
//           {
//             url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-pharmacist-substitute",
//             valueCodeableConcept: {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/pharmacist-substitute",
//                   code: "form-not-available",
//                 },
//               ],
//             },
//           },
//           {
//             url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-maternity",
//             valueBoolean: false,
//           },
//           {
//             url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-medicationRequest",
//             valueReference: {
//               reference:
//                 "http://provider.com/medicationRequest/bcb57d25-5421-4006-b996-57795b1c80fc",
//             },
//           },
//           {
//             url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-strength",
//             valueString: "1",
//           },
//         ],
//         productOrService: {
//           coding: [
//             {
//               system:
//                 "http://nphies.sa/terminology/CodeSystem/scientific-codes",
//               code: "7000000518-120-100000073665",
//             },
//           ],
//         },
//       },
//     ],
//     extractedProductsData: [
//       {
//         extension: [
//           {
//             url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-adjudication-outcome",
//             valueCodeableConcept: {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/adjudication-outcome",
//                   code: "not-required",
//                 },
//               ],
//             },
//           },
//         ],
//         itemSequence: 1,
//         adjudication: [
//           {
//             category: {
//               coding: [
//                 {
//                   system: "http://terminology.hl7.org/CodeSystem/adjudication",
//                   code: "benefit",
//                 },
//               ],
//             },
//             amount: {
//               value: 21,
//               currency: "SAR",
//             },
//           },
//           {
//             category: {
//               coding: [
//                 {
//                   system: "http://terminology.hl7.org/CodeSystem/adjudication",
//                   code: "submitted",
//                 },
//               ],
//             },
//             amount: {
//               value: 21,
//               currency: "SAR",
//             },
//           },
//           {
//             category: {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/ksa-adjudication",
//                   code: "approved-quantity",
//                 },
//               ],
//             },
//             value: 1,
//           },
//         ],
//       },
//     ],
//   })
// );
