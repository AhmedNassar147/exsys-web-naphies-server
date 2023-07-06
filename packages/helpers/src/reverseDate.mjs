/*
 *
 * Helper: `reverseDate`.
 *
 */

const reverseDate = (dateValue) => {
  if (!dateValue) {
    return undefined;
  }

  const isAlreadyReversed = /\d{4,}-\d{2,}-\d{2,}/gim.test(dateValue || "");
  if (isAlreadyReversed) {
    return dateValue;
  }
  return dateValue ? dateValue.split("-").reverse().join("-") : dateValue;
};

export default reverseDate;
