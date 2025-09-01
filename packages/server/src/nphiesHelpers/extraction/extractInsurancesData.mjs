/*
 *
 * Helper:`extractInsurancesData`.
 *
 */
import {
  createDateFromNativeDate,
  getLastPartOfUrl,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const dateOptions = {
  returnReversedDate: false,
};

const getInsuranceItem = (
  { category, name, description, network, unit, term, benefit },
  index
) => {
  const { code: benefitCategoryCode } =
    extractNphiesCodeAndDisplayFromCodingType(category);

  const { code: benefitNetworkCode } =
    extractNphiesCodeAndDisplayFromCodingType(network);

  const { code: benefitUnitCode } =
    extractNphiesCodeAndDisplayFromCodingType(unit);

  const { code: benefitTermCode } =
    extractNphiesCodeAndDisplayFromCodingType(term);

  const benefits = isArrayHasData(benefit)
    ? benefit.reduce(
        (acc, { type, allowedMoney, allowedUnsignedInt, allowedString }) => {
          const { code, codingSystemUrl } =
            extractNphiesCodeAndDisplayFromCodingType(type);

          let itemValue = allowedString;
          let baseValue = allowedString;

          if (allowedMoney) {
            const { value, currency } = allowedMoney || {};
            itemValue = `${value} ${currency}`;
            baseValue = value;
          }

          const isUsingUnsignedInt = typeof allowedUnsignedInt === "number";

          if (isUsingUnsignedInt) {
            itemValue = allowedUnsignedInt;
            baseValue = allowedUnsignedInt;
          }

          const enahancedCode = code.replace(/-/g, "_");

          acc[enahancedCode] = itemValue;
          acc[`${enahancedCode}_base_value`] = baseValue;
          acc[`${enahancedCode}_using_unsiged_int`] = isUsingUnsignedInt
            ? "Y"
            : "N";
          acc[`${enahancedCode}_system_type`] =
            getLastPartOfUrl(codingSystemUrl);

          return acc;
        },
        {}
      )
    : undefined;

  return {
    benefitCategoryCode,
    benefitNetworkCode,
    benefitUnitCode,
    benefitTermCode,
    name,
    description,
    ...benefits,
    rowKey: index.toString(),
  };
};

const extractInsurancesData = (insurance) =>
  isArrayHasData(insurance)
    ? insurance.map(({ benefitPeriod, inforce, item }) => {
        const { start, end } = benefitPeriod || {};

        const benefitItems = isArrayHasData(item)
          ? item.map(getInsuranceItem)
          : undefined;

        return {
          benefitPeriodStart: createDateFromNativeDate(start, dateOptions)
            .dateString,
          benefitPeriodEnd: createDateFromNativeDate(end, dateOptions)
            .dateString,
          benefitInforce: inforce ? "Y" : "N",
          benefitItems,
        };
      })
    : undefined;

export default extractInsurancesData;
