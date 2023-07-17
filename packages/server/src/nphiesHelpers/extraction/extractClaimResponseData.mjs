/*
 *
 * Helper: `extractClaimResponseData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

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
  const { category, amount, value: itemValue } = adjudicationItem;
  const { code } = extractNphiesCodeAndDisplayFromCodingType(category);
  const { currency, value } = amount || {};

  const _code = code.replace(/-/g, "_");

  return {
    [`${_code}_value`]: typeof itemValue === "number" ? itemValue : value,
    [`${_code}_currency`]: currency,
  };
};

const extractClaimResponseData = ({
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
}) => {
  const {
    identifier: { value: claimRequestId },
  } = request || {
    identifier: {},
  };

  const [{ value: claimResponseId }] = identifier || [{}];

  const claimExtensionCode = getExtensionCode(extension);

  const { start, end } = preAuthPeriod || {};
  const errors = extractErrorsArray(error);

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

  return {
    claimResourceType: resourceType,
    claimResponseId: claimResponseId.replace("req_", "") || id,
    claimRequestId: claimRequestId.replace("req_", ""),
    claimStatus: status,
    claimOutcome: outcome,
    claimDisposition: disposition,
    claimPreauthRef: preAuthRef,
    claimPeriodStart: start,
    claimPeriodEnd: end,
    claimExtensionCode,
    processNotes: processNotes,
    productsData,
    claimErrors: errors,
  };
};

export default extractClaimResponseData;
