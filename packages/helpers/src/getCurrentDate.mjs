/*
 *
 * Helper: `getCurrentDate`.
 *
 */
import createDateFromNativeDate from "./createDateFromNativeDate.mjs";

const getCurrentDate = (returnReversedDate = false) =>
  createDateFromNativeDate({
    nativeDate: Date.now(),
    returnReversedDate,
  });

export default getCurrentDate;
