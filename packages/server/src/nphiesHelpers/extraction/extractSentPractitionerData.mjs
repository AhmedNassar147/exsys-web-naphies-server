/*
 *
 * Helper: `extractSentPractitionerData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

export const extractSentPractitionerItem = ({ resource }) => {
  const { id, name, identifier, gender } = resource;
  const [{ text }] = name || [{}];

  const [{ type, value }] = identifier || [];
  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);

  return {
    id,
    name: text,
    license: value,
    practitionerIdentifierType: [code, display].filter(Boolean).join(" - "),
    practitionerGender: gender,
  };
};

const extractSentPractitionerData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  return entryGroupArray.reduce((acc, item) => {
    const { resource } = item;
    acc[resource.id] = extractSentPractitionerItem(item);
    return acc;
  }, {});
};

export default extractSentPractitionerData;

// {
//   '1001': {
//     id: '1001',
//     name: 'Ehab HAGGAG ALY Hajaj',
//     license: '2600112566',
//     practitionerIdentifierType: 'MD',
//     practitionerGender: undefined
//   }
// }
// console.log(
//   extractSentPractitionerData({
//     entryGroupArray: [
//       {
//         fullUrl: "http://provider.com/Practitioner/1001",
//         resource: {
//           resourceType: "Practitioner",
//           id: "1001",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/practitioner|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               type: {
//                 coding: [
//                   {
//                     system: "http://terminology.hl7.org/CodeSystem/v2-0203",
//                     code: "MD",
//                   },
//                 ],
//               },
//               system: "http://nphies.sa/license/practitioner-license",
//               value: "2600112566",
//             },
//           ],
//           active: true,
//           name: [
//             {
//               given: ["Ehab", "HAGGAG", "ALY", "Hajaj"],
//               text: "Ehab HAGGAG ALY Hajaj",
//               family: "Hajaj",
//               use: "official",
//             },
//           ],
//         },
//       },
//     ],
//   })
// );
