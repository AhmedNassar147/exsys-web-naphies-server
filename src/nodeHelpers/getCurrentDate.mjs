/*
 *
 * Helper: `getCurrentDate`.
 *
 */
const formalizeValue = (value) => {
  const strValue = value.toString();
  return value < 10 ? `0${strValue}` : strValue;
};

const getCurrentDate = () => {
  const ts = Date.now();

  const date = new Date(ts);
  const day = date.getDate();
  const year = date.getFullYear();
  const month = formalizeValue(date.getMonth() + 1);
  const hours = formalizeValue(date.getHours());
  const minutes = formalizeValue(date.getMinutes());
  const seconds = formalizeValue(date.getSeconds());
  const amOrPm = date.getHours() < 12 ? "am" : "pm";

  const time = `${hours}:${minutes}:${seconds} ${amOrPm}`;
  const dateString = `${day}-${month}-${year}`;

  return {
    time,
    dateString,
  };
};

export default getCurrentDate;
