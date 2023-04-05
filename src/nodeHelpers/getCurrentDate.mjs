/*
 *
 * Helper: `getCurrentDate`.
 *
 */
const getCurrentDate = () => {
  const date = new Date();
  const [dateString, time] = date.toLocaleString().split(", ");
  const [month, day, year] = dateString.split("/");

  return {
    time: time.toLowerCase(),
    dateString: `${day}-${month}-${year}`,
  };
};

export default getCurrentDate;
