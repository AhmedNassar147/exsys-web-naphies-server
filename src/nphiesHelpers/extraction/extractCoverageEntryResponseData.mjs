/*
 *
 * Helper: `extractCoverageEntryResponseData`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

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

const extractCoverageEntryResponseData = ({
  resourceType,
  id,
  identifier,
  status,
  costToBeneficiary,
  network,
  dependent,
  class: classes,
  error,
}) => {
  const [{ value: memberid }] = identifier || [{}];
  const [{ value: payor }] = classes || [{}];
  const [{ code: type }] = error || [{}];
  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);

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
        code: extractNphiesCodeAndDisplayFromCodingType(type).code,
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
    error: display,
    errorCode: code,
    ...copayValues,
    classes: classesValues,
  };
};

export default extractCoverageEntryResponseData;
