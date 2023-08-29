/*
 *
 * Helper: `reverseDate`.
 *
 */
import isAlreadyReversedDate from "./isAlreadyReversedDate.mjs";

const reverseDate = (dateValue) => {
  if (!dateValue) {
    return undefined;
  }

  if (isAlreadyReversedDate(dateValue)) {
    return dateValue;
  }
  return dateValue ? dateValue.split("-").reverse().join("-") : dateValue;
};

export default reverseDate;
