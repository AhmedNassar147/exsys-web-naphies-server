/*
 *
 * Helper: `formatDateToNativeDateParts`.
 *
 */
import reverseDate from "./reverseDate.mjs";

const formatDateToNativeDateParts = (date, stringifyReturnedDate) => {
  if (!date) {
    return undefined;
  }

  const reversedDate = reverseDate(date);

  const [__date, time] = reversedDate.split(" ");

  const [year, month, day] = __date.split("-");
  const timeParts = (time || "").split(":");

  const dateParts = [+year, month, +day, ...timeParts].filter(Boolean);

  return stringifyReturnedDate ? dateParts.reverse().join("-") : dateParts;
};

export default formatDateToNativeDateParts;

// const date = "2023-12-05 11:10:12";
// console.log(formatDateToNativeDateParts(date));
