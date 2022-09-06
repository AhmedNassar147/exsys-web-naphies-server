/*
 *
 * Helper: `convertDateToExsysNormalFormat`.
 *
 */
const regexp = /^\d{4}-\d{2}-\d{2}/;

const convertDateToExsysNormalFormat = (date) => {
  if (date) {
    const [foundDate] = date.match(regexp) || [];

    if (foundDate) {
      return foundDate.split("-").reverse().join("-");
    }

    return date;
  }

  return date;
};

export default convertDateToExsysNormalFormat;
