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
    use3Plus,
  } = options || {};

  const reversedDate = reverseDate(date);

  const [__date, time] = reversedDate.split(/T|\s/);
  const [year, month, day] = __date.split("-");

  const __month = subtractMonthBy ? month - subtractMonthBy : month;

  const timeParts = (time || "").replace("+03:00", "").split(":");

  const dateParts = [+year, __month, day, ...timeParts].filter(Boolean);

  if (stringifyReturnedDate) {
    let dateValue = [day, __month, +year].filter(Boolean);

    if (use3Plus) {
      dateValue = dateValue.reverse().join("-");
    } else {
      dateValue = dateValue.join("-");
    }

    let __time = [...timeParts].filter(Boolean).join(":");

    if (__time && !ignoreTime) {
      if (use3Plus) {
        return `${dateValue}T${__time}+03:00`;
      }

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

// "encounterPeriodStart": "2024-11-27 14:27:00",
// "encounterPeriodEnd": "2024-11-27 00:00:00",

// 2024-10-27T00:00:00+03:00
// console.log(
//   formatDateToNativeDateParts("2024-11-27 00:00:00", {
//     stringifyReturnedDate: true,
//     use3Plus: true,
//     subtractMonthBy: 1,
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
