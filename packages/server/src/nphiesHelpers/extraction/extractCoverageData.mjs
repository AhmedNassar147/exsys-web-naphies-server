/*
 *
 * Helper: `extractCoverageData`.
 *
 */
import { getLastPartOfUrl, isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractCoverageRelationship from "./extractCoverageRelationship.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";

const extractCostToBeneficiaryItemValues = (item, keyOfValue) => {
  const { [keyOfValue]: value, type } = item;

  if (!value) {
    return {};
  }
  const { value: _value, currency } = value;
  const { code } = extractNphiesCodeAndDisplayFromCodingType(type);

  return {
    value: _value,
    currency,
    code: code,
  };
};

const extractCoverageData = ({ entryGroupArray, isRequest }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    resourceType,
    id,
    identifier,
    status,
    costToBeneficiary,
    network,
    dependent,
    class: classes,
    error,
    period,
    relationship,
    type,
    policyHolder,
    subscriberId,
  } = resource;

  const [memberId] = extractIdentifierData(identifier);
  const [{ value: firstPayorName, code: firstPayorCode }] = classes || [{}];
  const errors = extractErrorsArray(error);

  const copayValues = isArrayHasData(costToBeneficiary)
    ? costToBeneficiary.reduce((acc, item) => {
        if (item.valueMoney) {
          const { value, currency } = extractCostToBeneficiaryItemValues(
            item,
            "valueMoney"
          );
          acc.coverageMaxCopay = value;
          acc.coverageCurrency = currency;
          return acc;
        }

        if (item.valueQuantity) {
          const { value, code } = extractCostToBeneficiaryItemValues(
            item,
            "valueQuantity"
          );
          acc.coverageCopayPct = value;
          acc.coverageCopayPctCode = code;
          return acc;
        }

        return acc;
      }, {})
    : null;

  const classesValues = isArrayHasData(classes)
    ? classes.map(({ value, name, type }) => ({
        key: extractNphiesCodeAndDisplayFromCodingType(type).code,
        value,
        name,
      }))
    : undefined;

  const { start, end } = period || {};

  const { reference: policyHolderRef } = policyHolder || {};

  const idFieldName = isRequest ? "coverageRequestId" : "coverageResponseId";

  return {
    coverageResourceType: resourceType,
    [idFieldName]: id,
    coverageStatus: status,
    memberId,
    coverageFirstPayorName: firstPayorName,
    coverageFirstPayorCode: firstPayorCode,
    coverageNetwork: network,
    coverageDependent: dependent,
    coverageStartDate: start,
    coverageEndDate: end,
    policyHolderOrganizationId: getLastPartOfUrl(policyHolderRef),
    coverageType: extractNphiesCodeAndDisplayFromCodingType(type).code,
    relationship: extractCoverageRelationship(relationship),
    ...copayValues,
    coverageClasses: classesValues,
    coverageSubscriberId: subscriberId,
    coverageErrors: errors && errors.length ? errors : undefined,
  };
};

export default extractCoverageData;

// {
//   coverageResourceType: 'Coverage',
//   coverageRequestId: 'd62b409e-4310-4f54-a313-fa8c49d198f0',
//   coverageStatus: 'active',
//   memberId: '2435328659',
//   coverageFirstPayorName: '472266009',
//   coverageFirstPayorCode: undefined,
//   coverageNetwork: '0',
//   coverageDependent: undefined,
//   coverageStartDate: undefined,
//   coverageEndDate: undefined,
//   policyHolderOrganizationId: '13',
//   coverageType: 'EHCPOL',
//   relationship: 'Self',
//   coverageClasses: [ { key: 'plan', value: '472266009', name: 'SILVER' } ],
//   coverageErrors: undefined
// }
// console.log(
//   extractCoverageData({
//     entryGroupArray: [
//       {
//         fullUrl:
//           "http://exsyssolutions.com/Coverage/d62b409e-4310-4f54-a313-fa8c49d198f0",
//         resource: {
//           resourceType: "Coverage",
//           id: "d62b409e-4310-4f54-a313-fa8c49d198f0",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/coverage|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               system: "http://payer.com/memberid",
//               value: "2435328659",
//             },
//           ],
//           status: "active",
//           type: {
//             coding: [
//               {
//                 system: "http://nphies.sa/terminology/CodeSystem/coverage-type",
//                 code: "EHCPOL",
//               },
//             ],
//           },
//           policyHolder: {
//             reference: "http://exsyssolutions.com/Organization/13",
//           },
//           subscriber: {
//             reference: "http://exsyssolutions.com/Patient/237589",
//           },
//           beneficiary: {
//             reference: "http://exsyssolutions.com/Patient/237589",
//           },
//           relationship: {
//             coding: [
//               {
//                 system:
//                   "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
//                 code: "self",
//                 display: "Self",
//               },
//             ],
//           },
//           payor: [
//             {
//               reference: "http://exsyssolutions.com/Organization/7001571327",
//             },
//           ],
//           network: "0",
//           class: [
//             {
//               type: {
//                 coding: [
//                   {
//                     system:
//                       "http://terminology.hl7.org/CodeSystem/coverage-class",
//                     code: "plan",
//                   },
//                 ],
//               },
//               value: "472266009",
//               name: "SILVER",
//             },
//           ],
//         },
//       },
//     ],
//     isRequest: true,
//   })
// );
