/*
 *
 * Helper: roundNumber;
 *
 */
const roundNumber = (value, numberOfDigits) =>
  +(Math.round(value + "e+" + numberOfDigits) + "e-" + numberOfDigits);

export default roundNumber;

function round(number, precision) {
  var pair = (number + "e").split("e");
  var value = Math.round(pair[0] + "e" + (+pair[1] + precision));
  pair = (value + "e").split("e");
  return +(pair[0] + "e" + (+pair[1] - precision));
}

const d = 3 * 154.35 * 0.9 + 0;

// console.log("d", d);
console.log(
  d.toLocaleString("en", { maximumFractionDigits: 2, useGrouping: false })
);
// "quantity": {
//   "value": 3
// },
// "unitPrice": {
//   "value": 154.35,
//   "currency": "SAR"
// },
// "factor": 0.9,
// "net": {
//   "value": 416.74,
//   "currency": "SAR"
// }
