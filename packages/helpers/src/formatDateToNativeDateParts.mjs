/*
 *
 * Helper: `formatDateToNativeDateParts`.
 *
 */
import createTimestamp from "./createTimestamp.mjs";
import reverseDate from "./reverseDate.mjs";

const formatDateToNativeDateParts = (
  date,
  { stringifyReturnedDate, subtractMonthBy, returnResultAsTimeStamp }
) => {
  if (!date) {
    return undefined;
  }

  const reversedDate = reverseDate(date);

  const [__date, time] = reversedDate.split(" ");

  const [year, month, day] = __date.split("-");
  const timeParts = (time || "").split(":");

  const __month = subtractMonthBy ? month - subtractMonthBy : month;

  const dateParts = [+year, __month, +day, ...timeParts].filter(Boolean);

  if (stringifyReturnedDate) {
    return dateParts.reverse().join("-");
  }

  return returnResultAsTimeStamp ? createTimestamp(dateParts) : dateParts;
};

export default formatDateToNativeDateParts;

// const date = "2023-12-05 11:10:12";
// console.log(formatDateToNativeDateParts(date));
