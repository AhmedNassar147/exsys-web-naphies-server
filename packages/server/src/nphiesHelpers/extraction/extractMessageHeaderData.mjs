/*
 *
 * Helper: `extractMessageHeaderData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";

const extractMessageHeaderData =
  (messageHeaderReplacedRegexp = /-response/) =>
  ({ entryGroupArray }) => {
    if (!isArrayHasData(entryGroupArray)) {
      return null;
    }

    const [{ resource }] = entryGroupArray;

    const { eventCoding, response } = resource;

    const { code } = eventCoding || {};

    const { identifier, code: responseCode } = response || {};

    return {
      messageHeaderRequestType: (code || "").replace(
        messageHeaderReplacedRegexp,
        ""
      ),

      messageHeaderResponseIdentifier: identifier,
      messageHeaderResponseCode: responseCode,
    };
  };

export default extractMessageHeaderData;

// {
//   messageHeaderRequestType: 'eligibility-request',
//   messageHeaderResponseIdentifier: undefined,
//   messageHeaderResponseCode: undefined
// }
// console.log(
//   extractMessageHeaderData()({
//     entryGroupArray: [
//       {
//         fullUrl: "urn:uuid:2bb5f67c-eda8-49c8-aa55-31a98903531d",
//         resource: {
//           resourceType: "MessageHeader",
//           id: "2bb5f67c-eda8-49c8-aa55-31a98903531d",
//           meta: {
//             profile: [
//               "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/message-header|1.0.0",
//             ],
//           },
//           eventCoding: {
//             system:
//               "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
//             code: "eligibility-request",
//           },
//           destination: [
//             {
//               endpoint: "http://nphies.sa/license/payer-license/7001571327",
//               receiver: {
//                 type: "Organization",
//                 identifier: {
//                   system: "http://nphies.sa/license/payer-license",
//                   value: "7001571327",
//                 },
//               },
//             },
//           ],
//           sender: {
//             type: "Organization",
//             identifier: {
//               system: "http://nphies.sa/license/provider-license",
//               value: "10000300097704",
//             },
//           },
//           source: {
//             endpoint: "http://nphies.sa/license/payer-license/10000300097704",
//           },
//           focus: [
//             {
//               reference:
//                 "http://exsyssolutions.com/CoverageEligibilityRequest/d62b409e-4310-4f54-a313-fa8c49d198f0",
//             },
//           ],
//         },
//       },
//     ],
//   })
// );
