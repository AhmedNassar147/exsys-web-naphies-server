/*
 *
 * Helper: `isAlreadyReversedDate`.
 *
 */
const isAlreadyReversedDate = (dateValue) =>
  /\d{4,}-\d{2,}-\d{2,}/.test(dateValue || "");

export default isAlreadyReversedDate;
