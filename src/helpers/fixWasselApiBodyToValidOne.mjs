/*
 *
 * Helper: `fixWasselApiBodyToValidOne`.
 *
 */
const dateFieldsName = ["dob"];

const convertDate = (dateValue) => {
  if (!dateValue) {
    return;
  }
  return dateValue.split("-").reverse().join("-");
};

const fixWasselApiBodyToValidOne = (bodyData) => {
  let finalData = {};

  for (const key in bodyData) {
    let value = bodyData[key];

    if (dateFieldsName.includes(key)) {
      value = convertDate(value);
    }

    finalData[key] = value;
  }

  return finalData;
};

export default fixWasselApiBodyToValidOne;
