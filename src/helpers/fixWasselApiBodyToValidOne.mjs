/*
 *
 * Helper: `fixWasselApiBodyToValidOne`.
 *
 */
const dateFieldsName = ["dob", "expiryDate", "serviceDate", "toDate"];

const convertDate = (dateValue) => {
  if (!dateValue) {
    return undefined;
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

    if (Array.isArray(value)) {
      value = value.map((item) => fixWasselApiBodyToValidOne(item));
    }

    if (value && value.constructor.toString().includes("Object")) {
      value = fixWasselApiBodyToValidOne(value);
    }

    finalData[key] = value;
  }

  return finalData;
};

export default fixWasselApiBodyToValidOne;

// const data = {
//   firstName: null,
//   middleName: null,
//   lastName: null,
//   familyName: null,
//   fullName: "AHMED SHAWKI",
//   dob: "01-08-1991",
//   gender: "MALE",
//   nationality: null,
//   contactNumber: null,
//   email: null,
//   emergencyNumber: null,
//   documentType: "PRC",
//   documentId: "2429674985",
//   eHealthId: null,
//   residencyType: null,
//   bloodGroup: null,
//   martialStatus: null,
//   preferredLanguage: null,
//   addressLine: null,
//   streetLine: null,
//   city: null,
//   state: null,
//   country: null,
//   postalCode: null,
//   insurancePlans: [
//     {
//       payerNphiesId: "7000911508",
//       expiryDate: "19-12-2022",
//       payerId: "7000911508",
//       memberCardId: "002429674985001",
//       policyNumber: "20972217",
//       relationWithSubscriber: "SELF",
//       coverageType: "EHCPOL",
//       isPrimary: true,
//       maxLimit: 100,
//       patientShare: 20,
//       tpaNphiesId: null,
//     },
//     {
//       payerNphiesId: "7001571327",
//       expiryDate: "07-10-2022",
//       payerId: "7001571327",
//       memberCardId: "002429674985022",
//       policyNumber: "20972255",
//       relationWithSubscriber: "SELF",
//       coverageType: "EHCPOL",
//       isPrimary: false,
//       maxLimit: "100",
//       patientShare: "20",
//       tpaNphiesId: null,
//     },
//   ],
// };
