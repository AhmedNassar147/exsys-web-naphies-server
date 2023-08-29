/*
 *
 * Helper: `reverseDate`.
 *
 */
import isAlreadyReveredDate from "./isAlreadyReveredDate.mjs";

const reverseDate = (dateValue) => {
  if (!dateValue) {
    return undefined;
  }

  if (isAlreadyReveredDate(dateValue)) {
    return dateValue;
  }
  return dateValue ? dateValue.split("-").reverse().join("-") : dateValue;
};

export default reverseDate;
