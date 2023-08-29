/*
 *
 * Helper: `isAlreadyReversedDate`.
 *
 */
const isAlreadyReversedDate = (dateValue) =>
  /\d{4,}-\d{2,}-\d{2,}/gim.test(dateValue || "");

export default isAlreadyReversedDate;
