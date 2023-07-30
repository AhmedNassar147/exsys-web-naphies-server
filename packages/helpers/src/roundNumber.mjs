/*
 *
 * Helper: roundNumber;
 *
 */
const roundNumber = (value, numberOfDigits) =>
  +(Math.round(value + "e+" + numberOfDigits) + "e-" + numberOfDigits);

export default roundNumber;

// const d = 3 * 154.35 * 0.9 + 0;

// function createRound(methodName) {
//   const func = Math[methodName];
//   return (number, precision) => {
//     precision =
//       precision == null
//         ? 0
//         : precision >= 0
//         ? Math.min(precision, 292)
//         : Math.max(precision, -292);
//     if (precision) {
//       // Shift with exponential notation to avoid floating-point issues.
//       // See [MDN](https://mdn.io/round#Examples) for more details.
//       let pair = `${number}e`.split("e");
//       const value = func(`${pair[0]}e${+pair[1] + precision}`);

//       pair = `${value}e`.split("e");
//       return +`${pair[0]}e${+pair[1] - precision}`;
//     }
//     return func(number);
//   };
// }

// console.log("d", d);
// console.log(createRound("round")(1.7777777, 2));
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
