/*
 *
 * Helper: `extractLocationData`.
 *
 */
import { getLastPartOfUrl, isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";

const extractLocationData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const { name, type, id, identifier, managingOrganization } = resource || {};

  const [locationLicense] = extractIdentifierData(identifier);

  const { reference } = managingOrganization || {};

  const curedType = isArrayHasData(type) ? type[0] : type;

  return {
    locationBundleId: id,
    facilityName: name,
    facilityType: extractNphiesCodeAndDisplayFromCodingType(curedType).code,
    locationLicense,
    locationManagingOrganizationId: getLastPartOfUrl(reference),
  };
};

export default extractLocationData;

// {
//   locationBundleId: '2be11333-08ed-422a-9923-931c5a475f63',
//   facilityName: 'Alsaggaf Eye Center And Day Surgery',
//   facilityType: 'GACH',
//   locationLicense: 'GACH',
//   locationManagingOrganizationId: '6'
// }
// console.log(
//   extractLocationData({
//     entryGroupArray: [
//       {
//         fullUrl:
//           "http://exsyssolutions.com/Location/2be11333-08ed-422a-9923-931c5a475f63",
//         resource: {
//           resourceType: "Location",
//           id: "2be11333-08ed-422a-9923-931c5a475f63",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/location|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               system: "http://nphies.sa/license/location-license",
//               value: "GACH",
//             },
//           ],
//           status: "active",
//           name: "Alsaggaf Eye Center And Day Surgery",
//           type: [
//             {
//               coding: [
//                 {
//                   system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
//                   code: "GACH",
//                 },
//               ],
//             },
//           ],
//           managingOrganization: {
//             reference: "http://exsyssolutions.com/Organization/6",
//           },
//         },
//       },
//     ],
//   })
// );
