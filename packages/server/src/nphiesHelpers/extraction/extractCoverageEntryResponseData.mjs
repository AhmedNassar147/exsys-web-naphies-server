/*
 *
 * Helper: `extractCoverageEntryResponseData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";

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
  resource: {
    resourceType,
    id,
    identifier,
    status,
    costToBeneficiary,
    network,
    dependent,
    class: classes,
    error,
  },
}) => {
  const [{ value: memberid }] = identifier || [{}];
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

  return {
    coverageResourceType: resourceType,
    coverageResponseId: id,
    coverageStatus: status,
    coverageMemberid: memberid,
    coverageFirstPayorName: firstPayorName,
    coverageFirstPayorCode: firstPayorCode,
    coverageNetwork: network,
    coverageDependent: dependent,
    ...copayValues,
    coverageClasses: classesValues,
    coverageErrors: errors,
  };
};

export default extractCoverageEntryResponseData;
