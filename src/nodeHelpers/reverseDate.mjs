/*
 *
 * Helper: `reverseDate`.
 *
 */

const reverseDate = (birthDate) =>
  birthDate ? birthDate.split("-").reverse().join("-") : birthDate;

export default reverseDate;
