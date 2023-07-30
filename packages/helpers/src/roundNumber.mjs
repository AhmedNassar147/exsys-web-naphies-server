/*
 *
 * Helper: roundNumber;
 *
 */
const roundNumber = (value, numberOfDigits) =>
  +(Math.round(value + "e+" + numberOfDigits) + "e-" + numberOfDigits);

export default roundNumber;
