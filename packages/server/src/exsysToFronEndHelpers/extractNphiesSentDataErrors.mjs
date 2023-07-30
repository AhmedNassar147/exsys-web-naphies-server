/*
 *
 * Helper: `extractNphiesSentDataErrors`.
 *
 */

const getItemSequenceFromError = ({ error, errorCode, matchWith }) => {
  if (error) {
    const regexp = new RegExp(`/${matchWith}\[\d\]/gm`);
    const [valueWithIndex] = error.match(regexp) || [];
    const [index] = (valueWithIndex || "").match(/\d/g) || [];

    if (index) {
      const sequence = +index + 1;

      return sequence;
    }
  }

  return undefined;
};

const extractNphiesSentDataErrors = ({ claimErrors }) => {
  const productErrors = {};
  const diagnosisErrors = {};
  const supportInfoErrors = {};

  if (isArray(claimErrors)) {
    claimErrors.forEach((errorData) => {
      const { error, errorCode } = errorData;
      if (error.includes(".item[")) {
        const sequence = getItemSequenceFromError({
          ...errorData,
          matchWith: "item",
        });

        if (sequence) {
          const previousSequenceError = productErrors[sequence];

          productErrors = {
            [sequence]: [
              previousSequenceError,
              `${error} ${errorCode ? ` - {${errorCode}}` : ""}`,
            ]
              .filter(Boolean)
              .join("\n"),
          };
        }
      }
    });
  }

  return {
    productErrors,
    diagnosisErrors,
    supportInfoErrors,
  };
};
