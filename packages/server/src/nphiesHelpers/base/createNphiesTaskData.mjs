/*
 *
 * Helper: `createNphiesTaskData`.
 *
 */
import { getCurrentDate } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../../constants.mjs";

const { PROFILE_TASK } = NPHIES_BASE_PROFILE_TYPES;
const { TASK_CODE, TASK_INPUT_TYPE, TASK_REASON_CODE } = NPHIES_BASE_CODE_TYPES;
const { TASK } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, NPHIES_LICENSE_OWNER_URL } = NPHIES_API_URLS;

// If nullify is specified, then the original message may be retained for audit purposes but shall not be given out or displayed.
// Task.focus.identifier = a business identifier (e.g. Claim.identifier) of the main resource of the message to be cancelled.
// Optional task.input.type = ‘nullify’ and task.input.valueBoolean = ‘true’.
const pollOwnerData = {
  identifier: {
    system: NPHIES_LICENSE_OWNER_URL,
    value: "NPHIES",
  },
};

const { POLL, CANCEL, STATUS_CHECK } = NPHIES_REQUEST_TYPES;

const createNphiesTaskData = ({
  providerOrganization,
  payerOrganization,
  requestId,
  providerFocusUrl,
  requestType,
  siteUrl,
  operationRequestId,
  cancellationReasonCode,
  focusType,
  nullifyRequest,
}) => {
  const { dateString: currentDate } = getCurrentDate(true);
  const isPreauthOrClaimPollRequest = requestType === POLL;
  const isCancellingPreauthOrClaimRequest = requestType === CANCEL;
  const isPreauthOrClaimStatusCheck = requestType === STATUS_CHECK;

  const isStatusCheckOrCancel =
    isCancellingPreauthOrClaimRequest || isPreauthOrClaimStatusCheck;

  const requesterBaseUrl = `${
    isStatusCheckOrCancel ? `${siteUrl}/` : ""
  }Organization`;

  const cancelCodeType = nullifyRequest ? "nullify" : requestType;

  return {
    fullUrl: `${providerFocusUrl}/${requestId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: TASK,
        profileType: PROFILE_TASK,
        uuid: requestId,
      }),
      identifier: [
        {
          use: "official",
          system: providerFocusUrl.replace(TASK, TASK.toLowerCase()),
          value: isCancellingPreauthOrClaimRequest
            ? `Cancel_${requestId}`
            : `req_${requestId}`,
        },
      ],
      authoredOn: currentDate,
      lastModified: currentDate,
      status: "requested",
      intent: "order",
      priority: isStatusCheckOrCancel ? "routine" : "stat",
      code: {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${TASK_CODE}`,
            code: isPreauthOrClaimStatusCheck ? "status" : cancelCodeType,
          },
        ],
      },
      ...(isStatusCheckOrCancel
        ? {
            focus: {
              type: "Claim",
              identifier: {
                system: `${siteUrl}/${focusType}`,
                value: `req_${operationRequestId}`,
              },
            },
          }
        : null),
      requester: {
        reference: `${requesterBaseUrl}/${providerOrganization}`,
      },
      owner: {
        ...(isStatusCheckOrCancel
          ? {
              reference: `${requesterBaseUrl}/${payerOrganization}`,
            }
          : pollOwnerData),
      },
      ...(isCancellingPreauthOrClaimRequest
        ? {
            reasonCode: {
              coding: [
                {
                  system: `${BASE_CODE_SYS_URL}/${TASK_REASON_CODE}`,
                  code: cancellationReasonCode,
                },
              ],
            },
          }
        : null),
      ...(isPreauthOrClaimPollRequest
        ? {
            input: [
              {
                type: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${TASK_INPUT_TYPE}`,
                      code: "count",
                    },
                  ],
                },
                valuePositiveInt: 1,
              },
            ],
          }
        : null),
    },
  };
};

export default createNphiesTaskData;
