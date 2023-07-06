/*
 *
 * Helper: `createNphiesTaskData`.
 *
 */
import { getCurrentDate, reverseDate } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_TASK } = NPHIES_BASE_PROFILE_TYPES;
const { TASK_CODE, TASK_INPUT_TYPE } = NPHIES_BASE_CODE_TYPES;
const { TASK } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, NPHIES_LICENSE_OWNER_URL } = NPHIES_API_URLS;

const createNphiesTaskData = ({
  providerOrganization,
  requestId,
  providerFocusUrl,
}) => {
  const { dateString } = getCurrentDate();
  const currentDate = reverseDate(dateString);

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
          value: `req_${requestId}`,
        },
      ],
      status: "requested",
      intent: "order",
      priority: "stat",
      code: {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${TASK_CODE}`,
            code: "poll",
          },
        ],
      },
      authoredOn: currentDate,
      lastModified: currentDate,
      requester: {
        reference: `Organization/${providerOrganization}`,
      },
      owner: {
        identifier: {
          system: NPHIES_LICENSE_OWNER_URL,
          value: "NPHIES",
        },
      },
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
    },
  };
};

export default createNphiesTaskData;
