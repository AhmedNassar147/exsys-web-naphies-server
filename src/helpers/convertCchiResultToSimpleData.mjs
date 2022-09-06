/*
 *
 * Helper: `convertCchiResultToSimpleData`.
 *
 */
import convertDateToExsysNormalFormat from "./convertDateToExsysNormalFormat.mjs";

const convertCchiResultToSimpleData = ({ result, ...rest }) => {
  const { isNewBorn, dob, gender, ...restResults } = result || {};
  let fixedGender = gender || "";
  fixedGender = fixedGender.length === 1 ? gender : fixedGender.toLowerCase();

  return {
    ...rest,
    result: {
      dob: convertDateToExsysNormalFormat(dob),
      gender: fixedGender,
      isNewBorn: !!isNewBorn,
      ...Object.keys(restResults).reduce((acc, currentKey) => {
        const isInsuranceList = currentKey === "insurancePlans";
        let currentKeyValue = restResults[currentKey];
        const isCurrentKeyValueNull = currentKeyValue === null;

        if (isInsuranceList) {
          const isEmptyInsuranceList = ![...(currentKeyValue || [])].length;
          currentKeyValue = isEmptyInsuranceList
            ? []
            : currentKeyValue.map(
                (
                  { expiryDate, isPrimary, payerId, payerNphiesId, ...item },
                  rowKey
                ) => ({
                  rowKey,
                  ...item,
                  isPrimary: isPrimary === "true",
                  expiryDate: convertDateToExsysNormalFormat(expiryDate),
                  payerNphiesId: payerNphiesId || payerId,
                  payerId: payerId || payerNphiesId,
                })
              );
        }

        acc[currentKey] = isCurrentKeyValueNull ? undefined : currentKeyValue;

        return acc;
      }, {}),
    },
  };
};

export default convertCchiResultToSimpleData;
