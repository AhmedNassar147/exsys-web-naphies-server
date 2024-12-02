/*
 *
 * Helper: `formatDateToNativeDateParts`.
 *
 */
import createTimestamp from "./createTimestamp.mjs";
import reverseDate from "./reverseDate.mjs";

const formatDateToNativeDateParts = (date, options) => {
  if (!date) {
    return undefined;
  }

  const {
    stringifyReturnedDate,
    subtractMonthBy,
    returnResultAsTimeStamp,
    replaceWith,
    ignoreTime,
  } = options || {};

  const reversedDate = reverseDate(date);

  const [__date, time] = reversedDate.split(/T|\s/);
  const [year, month, day] = __date.split("-");

  const timeParts = (time || "").replace("+03:00", "").split(":");

  const __month = subtractMonthBy ? month - subtractMonthBy : month;

  const dateParts = [+year, __month, day, ...timeParts].filter(Boolean);

  if (stringifyReturnedDate) {
    let dateValue = [day, __month, +year].filter(Boolean).join("-");
    const __time = [...timeParts].filter(Boolean).join(":");

    if (__time && !ignoreTime) {
      dateValue += ` ${__time}`;
    }

    return dateValue;
  }

  let value = returnResultAsTimeStamp ? createTimestamp(dateParts) : dateParts;

  if (replaceWith && replaceWith.length && typeof value === "string") {
    value = value.replace(...replaceWith);
  }

  return value;
};

export default formatDateToNativeDateParts;

// console.log(
//   formatDateToNativeDateParts("04-12-2023 10:25:00", {
//     stringifyReturnedDate: true,
//   })
// );

// const date1 = "2024-09-28T15:24:39+03:00"
// const date = "2023-12-05 11:10:12";
// const date2 = "05-10-2024";
// const date3 = "2024-09-28T00:00:00+03:00";

// console.log(
//   formatDateToNativeDateParts(date3, {
//     stringifyReturnedDate: true,
//   })
// );
