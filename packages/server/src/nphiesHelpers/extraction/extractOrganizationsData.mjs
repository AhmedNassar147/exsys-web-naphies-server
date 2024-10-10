/*
 *
 * Helper: `extractOrganizationsData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractExtensionsSentToNphies from "./extractExtensionsSentToNphies.mjs";
import { NPHIES_BASE_PROFILE_TYPES } from "../../constants.mjs";

const {
  INSURER_ORGANIZATION,
  POLICYHOLDER_ORGANIZATION,
  PROVIDER_ORGANIZATION,
} = NPHIES_BASE_PROFILE_TYPES;

const extractOrganizationsData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  return entryGroupArray.reduce((acc, item) => {
    const {
      resource: { name, identifier, id, extension, meta },
    } = item;
    const [value] = extractIdentifierData(identifier);

    const { profile } = meta;
    const [profileUrl] = profile;

    const isPolicyHolder = profileUrl.includes(POLICYHOLDER_ORGANIZATION);
    const isInSurer = profileUrl.includes(INSURER_ORGANIZATION);
    const isProvider = profileUrl.includes(PROVIDER_ORGANIZATION);

    const extensions = extractExtensionsSentToNphies(
      extension,
      isPolicyHolder ? "policyHolder" : isInSurer ? "insurer" : ""
    );

    const fullName = [value, name]
      .filter(Boolean)
      .join(" ")
      .replace(/\n|\t/, "");

    if (isPolicyHolder) {
      acc = {
        ...acc,
        policyHolderOrgBundleId: id || "",
        policyHolderOrg: fullName,
        ...extensions,
      };
    }

    if (isInSurer) {
      acc = {
        ...acc,
        insurerBundleId: id,
        insurer: fullName,
        receiver: value,
        ...extensions,
      };
    }

    if (isProvider) {
      acc = {
        ...acc,
        providerBundleId: id,
        provider: fullName,
        ...extensions,
      };
    }

    return acc;
  }, {});
};

export default extractOrganizationsData;

// {
//   providerBundleId: '6',
//   provider: '10000300097704 Alsaggaf Eye Center And Day Surgery',
//   extensions: {},
//   insurerBundleId: '7001571327',
//   insurer: '7001571327 Bupa',
//   receiver: '7001571327',
//   policyHolderOrgBundleId: '13',
//   policyHolderOrg: '472266009 Bupa-integrated leading company for modern se.-(SILVER)'
// }
// console.log(
//   extractOrganizationsData({
//     entryGroupArray: [
//       {
//         fullUrl: "http://exsyssolutions.com/Organization/6",
//         resource: {
//           resourceType: "Organization",
//           id: "6",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/provider-organization|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               system: "http://nphies.sa/license/provider-license",
//               value: "10000300097704",
//             },
//           ],
//           active: true,
//           type: [
//             {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/organization-type",
//                   code: "prov",
//                 },
//               ],
//             },
//           ],
//           name: "Alsaggaf Eye Center And Day Surgery",
//         },
//       },
//       {
//         fullUrl: "http://exsyssolutions.com/Organization/7001571327",
//         resource: {
//           resourceType: "Organization",
//           id: "7001571327",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/insurer-organization|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               system: "http://nphies.sa/license/payer-license",
//               value: "7001571327",
//             },
//           ],
//           active: true,
//           type: [
//             {
//               coding: [
//                 {
//                   system:
//                     "http://nphies.sa/terminology/CodeSystem/organization-type",
//                   code: "ins",
//                 },
//               ],
//             },
//           ],
//           name: "Bupa",
//         },
//       },
//       {
//         fullUrl: "http://exsyssolutions.com/Organization/13",
//         resource: {
//           resourceType: "Organization",
//           id: "13",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/policyholder-organization|1.0.0",
//             ],
//           },
//           identifier: [
//             {
//               system: "http://nphies.sa/identifier/organization",
//               value: "472266009",
//             },
//           ],
//           active: true,
//           name: "Bupa-integrated leading company for modern se.-(SILVER)",
//         },
//       },
//     ],
//   })
// );
