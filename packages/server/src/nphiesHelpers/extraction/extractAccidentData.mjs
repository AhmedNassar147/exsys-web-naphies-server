/*
 *
 * Helper: `extractAccidentData`.
 *
 */
import { formatDateToNativeDateParts } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const dateFormatOptions = { stringifyReturnedDate: true };

const extractAccidentData = (accident) => {
  const { date, type } = accident || {};

  const { code } = extractNphiesCodeAndDisplayFromCodingType(type);

  const value = [code, formatDateToNativeDateParts(date, dateFormatOptions)]
    .filter(Boolean)
    .join("---");

  return {
    accidentDateCode: value || undefined,
  };
};

export default extractAccidentData;
