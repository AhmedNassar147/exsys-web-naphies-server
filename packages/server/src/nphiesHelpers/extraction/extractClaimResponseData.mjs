/*
 *
 * Helper: `extractClaimResponseData`.
 *
 */
import {
  isArrayHasData,
  createDateFromNativeDate,
  toCamelCase,
  getLastPartOfUrl,
} from "@exsys-web-server/helpers";
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";

const getExtensionCode = (extension) => {
  const [{ valueCodeableConcept }] = extension || [{}];
  const { code } =
    extractNphiesCodeAndDisplayFromCodingType(valueCodeableConcept);

  return code;
};

const formatProductItem = (adjudicationItem) => {
  if (!adjudicationItem) {
    return {};
  }
  const { category, amount, reason, value: itemValue } = adjudicationItem;
  const { code } = extractNphiesCodeAndDisplayFromCodingType(category);
  const { currency, value } = amount || {};
  const { coding: reasonCoding } = reason | {};

  const _code = code.replace(/-/g, "_");

  return {
    [`${_code}_value`]: typeof itemValue === "number" ? itemValue : value,
    [`${_code}_currency`]: currency,
    [`${_code}_reason`]: isArrayHasData(reasonCoding)
      ? reasonCoding.reduce((acc, { code, display }) => {
          acc += `${acc ? ` / ` : ""}${code} - ${display}`;
          return acc;
        }, "")
      : undefined,
  };
};

const getExtensionData = (extension) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (acc, { url, valueCodeableConcept }) => {
        const { code } =
          extractNphiesCodeAndDisplayFromCodingType(valueCodeableConcept);

        if (url.includes("extension-adjudication-outcome")) {
          acc.claimExtensionCode = code;
          return acc;
        }

        const lastPartValue = getLastPartOfUrl(url, toCamelCase);

        if (lastPartValue) {
          acc.extensionOthersValues[lastPartValue] = code;
        }

        return acc;
      },
      {
        claimExtensionCode: "",
        extensionOthersValues: {},
      }
    );
  }

  return {
    claimExtensionCode: "",
    extensionOthersValues: null,
  };
};

const extractClaimResponseData = ({
  resource: {
    resourceType,
    id,
    status,
    outcome,
    disposition,
    preAuthRef,
    preAuthPeriod,
    extension,
    identifier,
    item,
    processNote,
    error,
    request,
    type,
    fundsReserve,
    output,
    priority,
    use,
  },
}) => {
  const { identifier: requestIdentifier } = request || {};
  const { value: requestIdentifierValue } = requestIdentifier || {};

  const claimRequestId = requestIdentifierValue
    ? requestIdentifierValue.replace("req_", "")
    : id;

  const [claimResponseId] = extractIdentifierData(identifier);

  const { code: claimMessageEventType } =
    extractNphiesCodeAndDisplayFromCodingType(type);

  const { claimExtensionCode, extensionOthersValues } =
    getExtensionData(extension);

  const { code: fundsReserveCode } =
    extractNphiesCodeAndDisplayFromCodingType(fundsReserve);

  const { start, end } = preAuthPeriod || {};

  const processNotes = isArrayHasData(processNote)
    ? processNote.map(({ text, number }) => `${number}-${text}`).join(` , `)
    : undefined;

  const productsData = isArrayHasData(item)
    ? item.map(({ extension, adjudication, itemSequence }) => ({
        sequence: itemSequence,
        status: getExtensionCode(extension),
        ...(isArrayHasData(adjudication)
          ? adjudication.reduce((acc, element) => {
              acc = {
                ...acc,
                ...formatProductItem(element),
              };

              return acc;
            }, {})
          : null),
      }))
    : undefined;

  const errors = [
    ...extractErrorsArray(error),
    ...extractNphiesOutputErrors(output),
  ];

  return {
    claimResourceType: resourceType,
    claimResponseId: claimResponseId.replace("req_", "") || id,
    claimRequestId,
    claimStatus: status,
    claimOutcome: outcome,
    claimDisposition: disposition,
    claimPreauthRef: preAuthRef,
    claimPeriodStart: createDateFromNativeDate(start).dateString,
    claimPeriodEnd: createDateFromNativeDate(end).dateString,
    claimPriority: priority,
    claimExtensionCode: !claimExtensionCode
      ? outcome === "queued"
        ? "pended"
        : outcome
      : claimExtensionCode,
    ...extensionOthersValues,
    claimMessageEventType,
    processNotes: processNotes,
    productsData,
    fundsReserveCode,
    claimUse: use,
    claimErrors: errors,
  };
};

export default extractClaimResponseData;
