/*
 *
 * helper: `extractPatientData`.
 *
 */
import {
  createDateFromNativeDate,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractExtensionsSentToNphies from "../../nphiesHelpers/extraction/extractExtensionsSentToNphies.mjs";

const extractPatientData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    id,
    identifier,
    name,
    telecom,
    gender,
    birthDate,
    maritalStatus,
    extension,
  } = resource;

  const [firstItem] = identifier || [];
  const { type, value: identifierValue } = firstItem || {};

  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);
  const [{ text }] = name || [{}];
  const [{ value: patientPhone }] = telecom || [{}];

  const { code: maritalStatusCode } =
    extractNphiesCodeAndDisplayFromCodingType(maritalStatus);

  const { dateString } = createDateFromNativeDate(birthDate, {
    returnReversedDate: false,
  });

  return {
    patientFileNo: id,
    patientName: text,
    patientBirthDate: dateString,
    patientGender: gender,
    patientPhone,
    patientIdentifierIdType: `${display} (${code})`,
    patientIdentifierId: identifierValue,
    maritalStatusCode,
    ...extractExtensionsSentToNphies(extension),
  };
};

export default extractPatientData;

// {
//   patientFileNo: '237589',
//   patientName: 'Ahmed Husen Ahmed Alamoudy',
//   patientBirthDate: '01-01-2017',
//   patientGender: 'male',
//   patientPhone: '0544397366',
//   patientIdentifierIdType: 'iqama (PRC)',
//   patientIdentifierId: '2435328659',
//   maritalStatusCode: 'U',
//   extensionOccupation: 'unknown'
// }
// console.log(
//   extractPatientData({
//     entryGroupArray: [
//       {
//         fullUrl: "http://exsyssolutions.com/Patient/237589",
//         resource: {
//           resourceType: "Patient",
//           id: "237589",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/patient|1.0.0",
//             ],
//           },
//           extension: [
//             {
//               url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-occupation",
//               valueCodeableConcept: {
//                 coding: [
//                   {
//                     system:
//                       "http://nphies.sa/terminology/CodeSystem/occupation",
//                     code: "unknown",
//                   },
//                 ],
//               },
//             },
//           ],
//           identifier: [
//             {
//               type: {
//                 coding: [
//                   {
//                     system: "http://terminology.hl7.org/CodeSystem/v2-0203",
//                     code: "PRC",
//                     display: "iqama",
//                   },
//                 ],
//               },
//               system: "http://nphies.sa/identifier/iqama",
//               value: "2435328659",
//             },
//           ],
//           active: true,
//           name: [
//             {
//               given: ["Ahmed", "Husen", "Ahmed", "Alamoudy"],
//               text: "Ahmed Husen Ahmed Alamoudy",
//               family: "Alamoudy",
//               use: "official",
//             },
//           ],
//           telecom: [
//             {
//               system: "phone",
//               value: "0544397366",
//             },
//           ],
//           gender: "male",
//           _gender: {
//             extension: [
//               {
//                 url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-ksa-administrative-gender",
//                 valueCodeableConcept: {
//                   coding: [
//                     {
//                       system:
//                         "http://nphies.sa/terminology/CodeSystem/ksa-administrative-gender",
//                       code: "male",
//                       display: "Male",
//                     },
//                   ],
//                 },
//               },
//             ],
//           },
//           birthDate: "2017-01-01",
//           maritalStatus: {
//             coding: [
//               {
//                 system:
//                   "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
//                 code: "U",
//               },
//             ],
//           },
//         },
//       },
//     ],
//   })
// );
