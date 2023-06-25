/*
 *
 * Helper: `reverseDate`.
 *
 */

const reverseDate = (birthDate) => {
  const isAlreadyReversed = /\d{4,}-\d{2,}-\d{2,}/gim.test(birthDate || "");
  if (isAlreadyReversed) {
    return birthDate;
  }
  return birthDate ? birthDate.split("-").reverse().join("-") : birthDate;
};

export default reverseDate;
