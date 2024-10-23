/*
 *
 * Helper: `extractPaymentReconciliation`.
 *
 */
import {
  isArrayHasData,
  getLastPartOfUrl,
  formatDateToNativeDateParts,
} from "@exsys-web-server/helpers";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";
import extractClaimResponseExtensions from "./extractClaimResponseExtensions.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const formatDate = (date, ignoreTime) =>
  formatDateToNativeDateParts(date, {
    stringifyReturnedDate: true,
    ignoreTime,
  });

const extractPaymentReconciliation = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    id,
    identifier,
    status,
    period,
    created,
    paymentIssuer,
    requestor,
    outcome,
    disposition,
    paymentDate,
    paymentAmount,
    detail,
    error,
    output,
  } = resource;

  const [identifierId, system] = extractIdentifierData(identifier);
  const { start, end } = period || {};

  const { reference: requestorUrl } = requestor || {};
  const { reference: insurerUrl } = paymentIssuer || {};
  const { value, currency } = paymentAmount || {};

  let _requestId = [];
  let _responseId = [];

  const __details__ = isArrayHasData(detail)
    ? detail.reduce(
        (
          acc,
          { extension, type, request, submitter, response, date, payee, amount }
        ) => {
          const { extensionCode, extensionOthersValues } =
            extractClaimResponseExtensions(extension);

          const { code, codingSystemUrl } =
            extractNphiesCodeAndDisplayFromCodingType(type);

          const { identifier } = request || {};

          const [requestId, requestIdentifierUrl] =
            extractIdentifierData(identifier);

          const { identifier: responseIdentifier } = response || {};
          const [responseId, responseUrl] =
            extractIdentifierData(responseIdentifier);

          const { reference } = submitter || {};
          const { reference: payeeUrl } = payee || {};
          const { value: paymentAmount, currency: paymentCurrency } =
            amount || {};

          _requestId = [requestId, _requestId].filter(Boolean);
          _responseId = [responseId, _responseId].filter(Boolean);

          acc[requestId] = {
            extensionCode,
            ...extensionOthersValues,
            type: code,
            codingSystemUrl,
            requestId,
            requestIdentifierUrl,
            submitterUrl: reference,
            date,
            responseId,
            responseUrl,
            payeeOrganizationId: getLastPartOfUrl(payeeUrl) || undefined,
            payeeUrl,
            paymentAmount,
            paymentCurrency,
          };

          return acc;
        },
        {}
      )
    : undefined;

  const errors = [
    ...extractErrorsArray(error),
    ...extractNphiesOutputErrors(output),
  ].filter(Boolean);

  console.log("__details__", __details__);

  return {
    paymentReconciliationData: {
      bundleId: id,
      _requestId: _requestId.join(","),
      _responseId: _responseId.join(","),
      identifier: identifierId,
      identifierUrl: system,
      outcome,
      disposition,
      paymentAmount: value,
      paymentCurrency: currency,
      created: formatDate(created),
      paymentDate,
      detail: __details__,
      status: status,
      periodStart: start,
      periodEnd: end,
      requestorUrl,
      insurerUrl,
      requesterOrganizationId: getLastPartOfUrl(requestorUrl) || undefined,
      insurerOrganizationId: getLastPartOfUrl(insurerUrl) || undefined,
      errors,
    },
  };
};

export default extractPaymentReconciliation;

// {
//   paymentReconciliationData: {
//     bundleId: "746994",
//     _requestId: "req_db007b4a-c917-4c16-b788-8c5c03aa9f57,",
//     _responseId: "1301742826263131819,",
//     identifier: "PAYID001640312|2024-10-18T21:29:43",
//     identifierUrl: "http://bupa.com.sa/paymentreconciliation",
//     outcome: "complete",
//     disposition:
//       "47218497|263131819|2024-04-16 00:00:00.0|2024-05-16 00:00:00.0|10000300122098|Balghasoon Polyclinic",
//     paymentAmount: 190.25,
//     paymentCurrency: "SAR",
//     created: "18-10-2024 21:29:43",
//     paymentDate: "2024-10-06",
//     detail: {
//       "req_db007b4a-c917-4c16-b788-8c5c03aa9f57": {
//         extensionCode: undefined,
//         extensionComponentPayment: 190.25,
//         type: "payment",
//         codingSystemUrl: "http://terminology.hl7.org/CodeSystem/payment-type",
//         requestId: "req_db007b4a-c917-4c16-b788-8c5c03aa9f57",
//         requestIdentifierUrl: "http://exsyssolutions.com/claim",
//         submitterUrl: "organization/6055",
//         date: "2024-08-05",
//         responseId: "1301742826263131819",
//         responseUrl: "https://bupa.com.sa/claimresponse",
//         payeeOrganizationId: "6055",
//         payeeUrl: "http://bupa.com.sa/Organization/6055",
//         paymentAmount: 190.25,
//         paymentCurrency: "SAR",
//       },
//     },
//     status: "active",
//     periodStart: "2024-04-16T00:00:00+03:00",
//     periodEnd: "2024-05-16T00:00:00+03:00",
//     requestorUrl: "http://bupa.com.sa/Organization/6055",
//     insurerUrl: "http://bupa.com.sa/Organization/3473",
//     requesterOrganizationId: "6055",
//     insurerOrganizationId: "3473",
//     errors: [],
//   },
// };

// console.log(
//   extractPaymentReconciliation({
//     entryGroupArray: [
//       {
//         fullUrl: "http://bupa.com.sa/PaymentReconciliation/746994",
//         resource: {
//           resourceType: "PaymentReconciliation",
//           id: "746994",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/payment-reconciliation|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               system: "http://bupa.com.sa/paymentreconciliation",
//               value: "PAYID001640312|2024-10-18T21:29:43",
//             },
//           ],
//           status: "active",
//           period: {
//             start: "2024-04-16T00:00:00+03:00",
//             end: "2024-05-16T00:00:00+03:00",
//           },
//           created: "2024-10-18T21:29:43+03:00",
//           paymentIssuer: {
//             reference: "http://bupa.com.sa/Organization/3473",
//           },
//           requestor: {
//             reference: "http://bupa.com.sa/Organization/6055",
//           },
//           outcome: "complete",
//           disposition:
//             "47218497|263131819|2024-04-16 00:00:00.0|2024-05-16 00:00:00.0|10000300122098|Balghasoon Polyclinic",
//           paymentDate: "2024-10-06",
//           paymentAmount: {
//             value: 190.25,
//             currency: "SAR",
//           },
//           detail: [
//             {
//               extension: [
//                 {
//                   url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-component-payment",
//                   valueMoney: {
//                     value: 190.25,
//                     currency: "SAR",
//                   },
//                 },
//               ],
//               type: {
//                 coding: [
//                   {
//                     system:
//                       "http://terminology.hl7.org/CodeSystem/payment-type",
//                     code: "payment",
//                   },
//                 ],
//               },
//               request: {
//                 identifier: {
//                   system: "http://exsyssolutions.com/claim",
//                   value: "req_db007b4a-c917-4c16-b788-8c5c03aa9f57",
//                 },
//               },
//               submitter: {
//                 reference: "organization/6055",
//               },
//               response: {
//                 identifier: {
//                   system: "https://bupa.com.sa/claimresponse",
//                   value: "1301742826263131819",
//                 },
//               },
//               date: "2024-08-05",
//               payee: {
//                 reference: "http://bupa.com.sa/Organization/6055",
//               },
//               amount: {
//                 value: 190.25,
//                 currency: "SAR",
//               },
//             },
//           ],
//         },
//       },
//     ],
//   })
// );
