/*
 *
 * Helper: `createNphiesCancellationPreauthOrClaimData`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractPreauthOrClaimCancellationResponseData from "../nphiesHelpers/extraction/extractPreauthOrClaimCancellationResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimCancellationData.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";
import createExsysRequest from "../helpers/createExsysRequest.mjs";

const {
  queryClaimOrPreauthDataToCancellation,
  savePreauthData,
  saveClaimData,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [NPHIES_RESOURCE_TYPES.TASK]: extractPreauthOrClaimCancellationResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ cancellationErrors }) =>
  cancellationErrors || [];

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    cancellationOutcome: "error",
    cancellationStatus: "error",
    issueError: errorMessage,
  },
});

const createExsysSaveApiParams = ({
  primaryKey,
  exsysSaveApiPrimaryKeyName,
  nphiesExtractedData: {
    bundleId,
    cancellationStatus,
    creationBundleId,
    issueError,
    issueErrorCode,
  },
}) => {
  const _outcome =
    !cancellationStatus || !!issueError || !!issueErrorCode
      ? "error"
      : cancellationStatus;

  return {
    [exsysSaveApiPrimaryKeyName]: primaryKey,
    bundle_id: bundleId,
    outcome: _outcome,
    creation_bundle_id: creationBundleId,
    request_type: "cancel",
  };
};

const createNphiesCancellationPreauthOrClaimData = async ({
  requestParams,
  exsysQueryApiDelayTimeout,
  nphiesApiDelayTimeout,
}) => {
  const { record_pk, request_type } = requestParams;

  const isClaimCancellationRequest =
    request_type === NPHIES_REQUEST_TYPES.CLAIM;

  const printFolderName = `cancellation/${request_type}/${record_pk}`;

  const exsysSaveApiId = isClaimCancellationRequest
    ? saveClaimData
    : savePreauthData;

  const exsysDataApiPrimaryKeyName = isClaimCancellationRequest
    ? "claim_pk"
    : "preauth_pk";

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: queryClaimOrPreauthDataToCancellation,
    exsysSaveApiId,
    requestParams,
    requestMethod: "GET",
    printFolderName,
    exsysDataApiPrimaryKeyName,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    exsysQueryApiDelayTimeout,
    nphiesApiDelayTimeout,
  });
};

export default createNphiesCancellationPreauthOrClaimData;

const data = {
  nodeServerDataSentToNaphies: {
    resourceType: "Bundle",
    id: "85b16e69-4d0f-41ec-b732-60d1256b2281",
    meta: {
      profile: [
        "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0",
      ],
    },
    type: "message",
    timestamp: "2023-08-21T11:28:11.230Z",
    entry: [
      {
        fullUrl: "urn:uuid:70992621-5234-467d-b97e-22d6746b71ad",
        resource: {
          resourceType: "MessageHeader",
          id: "70992621-5234-467d-b97e-22d6746b71ad",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/message-header|1.0.0",
            ],
          },
          eventCoding: {
            system:
              "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
            code: "cancel-request",
          },
          destination: [
            {
              endpoint: "http://nphies.sa/license/payer-license/INS-FHIR",
              receiver: {
                type: "Organization",
                identifier: {
                  system: "http://nphies.sa/license/payer-license",
                  value: "INS-FHIR",
                },
              },
            },
          ],
          sender: {
            type: "Organization",
            identifier: {
              system: "http://nphies.sa/license/provider-license",
              value: "PR-FHIR",
            },
          },
          source: {
            endpoint: "http://nphies.sa/license/provider-license/PR-FHIR",
          },
          focus: [
            {
              reference:
                "http://provider.com/Task/fef87bb0-86dc-42ef-a084-69936892183f",
            },
          ],
        },
      },
      {
        fullUrl:
          "http://provider.com/Task/fef87bb0-86dc-42ef-a084-69936892183f",
        resource: {
          resourceType: "Task",
          id: "fef87bb0-86dc-42ef-a084-69936892183f",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/task|1.0.0",
            ],
          },
          identifier: [
            {
              use: "official",
              system: "http://provider.com/task",
              value: "Cancel_fef87bb0-86dc-42ef-a084-69936892183f",
            },
          ],
          status: "requested",
          intent: "order",
          priority: "routine",
          code: {
            coding: [
              {
                system: "http://nphies.sa/terminology/CodeSystem/task-code",
                code: "cancel",
              },
            ],
          },
          focus: {
            type: "Claim",
            identifier: {
              system: "http://provider.com/claim",
              value: "req_bbaf0373-4d29-4772-8830-8a7fddcb4ba2",
            },
          },
          authoredOn: "2023-08-21",
          lastModified: "2023-08-21",
          requester: {
            reference: "http://provider.com/Organization/6",
          },
          owner: {
            reference: "http://provider.com/Organization/1",
          },
          reasonCode: {
            coding: [
              {
                system:
                  "http://nphies.sa/terminology/CodeSystem/task-reason-code",
                code: "WI",
              },
            ],
          },
        },
      },
      {
        fullUrl: "http://provider.com/Organization/6",
        resource: {
          resourceType: "Organization",
          id: "6",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/provider-organization|1.0.0",
            ],
          },
          identifier: [
            {
              system: "http://nphies.sa/license/provider-license",
              value: "PR-FHIR",
            },
          ],
          active: true,
          type: [
            {
              coding: [
                {
                  system:
                    "http://nphies.sa/terminology/CodeSystem/organization-type",
                  code: "prov",
                },
              ],
            },
          ],
          name: "Al Falah International Hospital",
        },
      },
      {
        fullUrl: "http://provider.com/Organization/1",
        resource: {
          resourceType: "Organization",
          id: "1",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/insurer-organization|1.0.0",
            ],
          },
          identifier: [
            {
              system: "http://nphies.sa/license/payer-license",
              value: "INS-FHIR",
            },
          ],
          active: true,
          type: [
            {
              coding: [
                {
                  system:
                    "http://nphies.sa/terminology/CodeSystem/organization-type",
                  code: "ins",
                },
              ],
            },
          ],
          name: "شركة التعاونية للتأمين -الرياض-حي الربيع طريق الثمامه ص.ب86959",
        },
      },
    ],
  },
  nphiesResponse: {
    resourceType: "Bundle",
    id: "284b2c2f-4260-47f4-a9e0-1d2050b43b1f",
    meta: {
      profile: [
        "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0",
      ],
    },
    type: "message",
    timestamp: "2023-08-21T12:28:22.606+00:00",
    entry: [
      {
        fullUrl:
          "http://pseudo-payer.com.sa/MessageHeader/8a273175-dbd5-4a85-a2e1-ab2a19adce48",
        resource: {
          resourceType: "MessageHeader",
          id: "8a273175-dbd5-4a85-a2e1-ab2a19adce48",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/message-header|1.0.0",
            ],
          },
          eventCoding: {
            system:
              "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
            code: "cancel-response",
          },
          destination: [
            {
              endpoint: "http://10.73.91.79/",
              receiver: {
                type: "Organization",
                identifier: {
                  system: "http://nphies.sa/license/provider-license",
                  value: "PR-FHIR",
                },
              },
            },
          ],
          sender: {
            type: "Organization",
            identifier: {
              system: "http://nphies.sa/license/payer-license",
              value: "INS-FHIR",
            },
          },
          source: {
            endpoint: "http://payer.com",
          },
          response: {
            identifier: "70992621-5234-467d-b97e-22d6746b71ad",
            code: "ok",
          },
          focus: [
            {
              reference:
                "http://pseudo-payer.com.sa/Task/fef87bb0-86dc-42ef-a084-69936892183f",
            },
          ],
        },
      },
      {
        fullUrl:
          "http://pseudo-payer.com.sa/Task/fef87bb0-86dc-42ef-a084-69936892183f",
        resource: {
          resourceType: "Task",
          id: "fef87bb0-86dc-42ef-a084-69936892183f",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/task|1.0.0",
            ],
          },
          identifier: [
            {
              system: "http://pseudo-payer.com.sa/task",
              value: "resp_35964",
            },
          ],
          status: "completed",
          intent: "order",
          priority: "routine",
          code: {
            coding: [
              {
                system: "http://nphies.sa/terminology/CodeSystem/task-code",
                code: "cancel",
              },
            ],
          },
          focus: {
            type: "Claim",
            identifier: {
              system: "http://provider.com/claim",
              value: "req_bbaf0373-4d29-4772-8830-8a7fddcb4ba2",
            },
          },
          authoredOn: "2023-08-21",
          lastModified: "2023-08-21",
          requester: {
            reference: "http://provider.com/Organization/6",
          },
          owner: {
            reference: "http://provider.com/Organization/1",
          },
          reasonCode: {
            coding: [
              {
                system:
                  "http://nphies.sa/terminology/CodeSystem/task-reason-code",
                code: "WI",
              },
            ],
          },
        },
      },
      {
        fullUrl: "http://provider.com/Organization/6",
        resource: {
          resourceType: "Organization",
          id: "6",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/provider-organization|1.0.0",
            ],
          },
          identifier: [
            {
              system: "http://nphies.sa/license/provider-license",
              value: "PR-FHIR",
            },
          ],
          active: true,
          type: [
            {
              coding: [
                {
                  system:
                    "http://nphies.sa/terminology/CodeSystem/organization-type",
                  code: "prov",
                },
              ],
            },
          ],
          name: "Al Falah International Hospital",
        },
      },
      {
        fullUrl: "http://provider.com/Organization/1",
        resource: {
          resourceType: "Organization",
          id: "1",
          meta: {
            profile: [
              "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/insurer-organization|1.0.0",
            ],
          },
          identifier: [
            {
              system: "http://nphies.sa/license/payer-license",
              value: "INS-FHIR",
            },
          ],
          active: true,
          type: [
            {
              coding: [
                {
                  system:
                    "http://nphies.sa/terminology/CodeSystem/organization-type",
                  code: "ins",
                },
              ],
            },
          ],
          name: "شركة التعاونية للتأمين -الرياض-حي الربيع طريق الثمامه ص.ب86959",
        },
      },
    ],
  },
  nphiesExtractedData: {
    bundleId: "284b2c2f-4260-47f4-a9e0-1d2050b43b1f",
    creationBundleId: "85b16e69-4d0f-41ec-b732-60d1256b2281",
    cancellationResourceType: "ClaimCancellation",
    cancellationResponseId: "35964",
    cancellationRequestId: "bbaf0373-4d29-4772-8830-8a7fddcb4ba2",
    cancellationStatus: "completed",
    cancellationOutcome: "completed",
    cancellationErrors: [],
  },
};

const result = await createExsysRequest({
  resourceName: savePreauthData,
  requestParams: {
    preauth_pk: 6,
    bundle_id: "284b2c2f-4260-47f4-a9e0-1d2050b43b1f",
    outcome: "completed",
    creation_bundle_id: "85b16e69-4d0f-41ec-b732-60d1256b2281",
    request_type: "cancel",
  },
  body: {
    preauth_pk: 6,
    ...data,
  },
});

console.log("result", result);
