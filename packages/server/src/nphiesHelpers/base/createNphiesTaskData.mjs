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

const pollOwnerData = {
  identifier: {
    system: NPHIES_LICENSE_OWNER_URL,
    value: "NPHIES",
  },
};

const createNphiesTaskData = ({
  providerOrganization,
  payerOrganization,
  requestId,
  providerFocusUrl,
  requestType,
  siteUrl,
  operationRequestId,
  cancellationReasonCode,
}) => {
  const { dateString: currentDate } = getCurrentDate(true);
  const isCancellingPreauthOrClaimRequest =
    requestType === NPHIES_REQUEST_TYPES.CANCEL;

  const isPreauthOrClaimPollRequest = requestType === NPHIES_REQUEST_TYPES.POLL;
  const isPreauthOrClaimStatusCheck =
    requestType === NPHIES_REQUEST_TYPES.STATUS_CHECK;

  const isStatusCheckOrCanCancel =
    isCancellingPreauthOrClaimRequest || isPreauthOrClaimStatusCheck;

  const requesterBaseUrl = `${
    isStatusCheckOrCanCancel ? `${siteUrl}/` : ""
  }Organization`;

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
      priority: isStatusCheckOrCanCancel ? "routine" : "stat",
      code: {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${TASK_CODE}`,
            code: isPreauthOrClaimStatusCheck ? "status" : requestType,
          },
        ],
      },
      ...(isStatusCheckOrCanCancel
        ? {
            focus: {
              type: "Claim",
              identifier: {
                system: `${siteUrl}/claim`,
                value: `req_${operationRequestId}`,
              },
            },
          }
        : null),
      requester: {
        reference: `${requesterBaseUrl}/${providerOrganization}`,
      },
      owner: {
        ...(isStatusCheckOrCanCancel
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
