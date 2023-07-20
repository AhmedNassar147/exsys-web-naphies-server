/*
 *
 * Helper: `createDateFromNativeDate`.
 *
 */
const formalizeValue = (value) => {
  const strValue = value.toString();
  return value < 10 ? `0${strValue}` : strValue;
};

const createDateFromNativeDate = ({
  nativeDate,
  returnReversedDate = true,
}) => {
  if (!nativeDate) {
    return {};
  }

  const date = new Date(nativeDate);
  const day = formalizeValue(date.getDate());
  const year = date.getFullYear();
  const month = formalizeValue(date.getMonth() + 1);
  const hours = formalizeValue(date.getHours());
  const minutes = formalizeValue(date.getMinutes());
  const seconds = formalizeValue(date.getSeconds());
  const amOrPm = date.getHours() < 12 ? "am" : "pm";

  const time = `${hours}:${minutes}:${seconds} ${amOrPm}`;
  const dateArray = [day, month, year];

  return {
    time,
    dateString: returnReversedDate
      ? dateArray.reverse().join("-")
      : dateArray.join("-"),
  };
};

export default createDateFromNativeDate;
