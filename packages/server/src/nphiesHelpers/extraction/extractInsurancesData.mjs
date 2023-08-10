/*
 *
 * Helper:`extractInsurancesData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const getInsuranceItem = ({
  category,
  name,
  description,
  network,
  unit,
  term,
  benefit,
}) => {
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
          const { code } = extractNphiesCodeAndDisplayFromCodingType(type);

          let itemValue = allowedString;

          if (allowedMoney) {
            const { value, currency } = allowedMoney || {};
            itemValue = `${value} ${currency}`;
          }

          if (typeof allowedUnsignedInt === "number") {
            itemValue = allowedUnsignedInt;
          }

          acc[code.replace(/-/g, "_")] = itemValue;

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
    benefits,
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
          benefitPeriodStart: start,
          benefitPeriodEnd: end,
          benefitInforce: inforce ? "Y" : "N",
          benefitItems,
        };
      })
    : undefined;

export default extractInsurancesData;
