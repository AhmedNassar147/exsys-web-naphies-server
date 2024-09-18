/*
 *
 * Helper: `formatDateToNativeDateParts`.
 *
 */
import reverseDate from "./reverseDate.mjs";

const formatDateToNativeDateParts = (date) => {
  if (!date) {
    return undefined;
  }

  const reversedDate = reverseDate(date);

  const [__date, time] = reversedDate.split(" ");

  const [year, month, day] = __date.split("-");
  const timeParts = (time || "").split(":");

  return [+year, month - 1, +day, ...timeParts].filter(Boolean);
};

export default formatDateToNativeDateParts;

// const date = "2023-12-05 11:10:12";
console.log(formatDateToNativeDateParts(date));
