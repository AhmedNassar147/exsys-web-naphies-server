/*
 *
 * Helper: `extractBillableDates`.
 *
 */
import {
  formatDateToNativeDateParts,
  isArrayHasData,
} from "@exsys-web-server/helpers";

const dateFormatOptions = { stringifyReturnedDate: true };

const extractBillableDates = (billablePeriod) => {
  if (!billablePeriod) {
    return null;
  }

  const { start, end } = billablePeriod || {};
  const billablePeriodStartDate = formatDateToNativeDateParts(
    start,
    dateFormatOptions
  );
  const billablePeriodEndDate = formatDateToNativeDateParts(
    end,
    dateFormatOptions
  );

  return {
    billablePeriod: [billablePeriodStartDate, billablePeriodEndDate]
      .filter(Boolean)
      .join(" ~ "),
  };
};

export default extractBillableDates;
