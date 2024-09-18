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

  const [date, time] = dateValue.split(" ");
  let reversedDate = date.split("-").reverse().join("-");

  if (time) {
    reversedDate += ` ${time}`;
  }

  return reversedDate;
};

export default reverseDate;
