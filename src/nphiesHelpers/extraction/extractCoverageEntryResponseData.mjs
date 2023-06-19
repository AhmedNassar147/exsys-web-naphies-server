/*
 *
 * Helper: `extractCoverageEntryResponseData`.
 *
 */
import extractNphiesCodeFromCodingType from "./extractNphiesCodeFromCodingType.mjs";

const extractCostToBeneficiaryItemValues = (item, keyOfValue) => {
  const { [keyOfValue]: value, type } = item;

  if (!value) {
    return {};
  }
  const { value: _value, currency } = value;

  return {
    value: _value,
    currency,
    code: extractNphiesCodeFromCodingType(type),
  };
};

const extractCoverageEntryResponseData = ({
  resourceType,
  id,
  identifier,
  status,
  costToBeneficiary,
  network,
  dependent,
  class: classes,
}) => {
  const [{ value: memberid }] = identifier || [{}];
  const [{ value: payor }] = classes || [{}];

  const copayValues = Array.isArray(costToBeneficiary)
    ? costToBeneficiary.reduce((acc, item) => {
        if (item.valueMoney) {
          const { value, currency } = extractCostToBeneficiaryItemValues(
            item,
            "valueMoney"
          );
          acc.maxCopay = value;
          acc.currency = currency;
          return acc;
        }

        if (item.valueQuantity) {
          const { value, code } = extractCostToBeneficiaryItemValues(
            item,
            "valueQuantity"
          );
          acc.copayPct = value;
          acc.copayPctCode = code;
          return acc;
        }

        return acc;
      }, {})
    : null;

  const classesValues = Array.isArray(classes)
    ? classes.map(({ value, name, type }) => ({
        code: extractNphiesCodeFromCodingType(type),
        value: value,
        name: name,
      }))
    : undefined;

  return {
    resourceType,
    responseId: id,
    status,
    memberid,
    payor,
    network,
    dependent,
    classes: classesValues,
    ...copayValues,
  };
};

export default extractCoverageEntryResponseData;
