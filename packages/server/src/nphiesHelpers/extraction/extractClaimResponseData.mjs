/*
 *
 * Helper: `extractClaimResponseData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
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

  return {
    [`${code}_value`]: value || itemValue,
    [`${code.replace("-", "_")}_currency`]: currency,
  };
};

const extractClaimResponseData = ({
  resourceType,
  id,
  status,
  outcome,
  preAuthRef,
  preAuthPeriod,
  extension,
  identifier,
  item,
  processNote,
  error,
}) => {
  const [{ value: claimResponseId }] = identifier || [{}];

  const claimExtensionCode = getExtensionCode(extension);

  const { start, end } = preAuthPeriod || {};
  const errors = extractErrorsArray(error);

  const processNotes = isArrayHasData(processNote)
    ? processNote.map(({ text, number }) => `${number}-${text}`).join(` , `)
    : undefined;

  const productsData = isArrayHasData(item)
    ? item.map(({ extension, adjudication }) => ({
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
    claimResponseId,
    claimRequestId: id,
    claimStatus: status,
    claimOutcome: outcome,
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