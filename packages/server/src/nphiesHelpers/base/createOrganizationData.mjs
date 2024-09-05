/*
 *
 * Helpers: `createOrganizationData`.
 *
 */
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
  ORGANIZATION_TYPE_VALUES,
} from "../../constants.mjs";

const { ORGANIZATION } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, BASE_PROFILE_URL } = NPHIES_API_URLS;
const { ORGANIZATION_TYPE, EXTENSION_PROVIDER_TYPE } = NPHIES_BASE_CODE_TYPES;

const PROVIDER_TYPE = EXTENSION_PROVIDER_TYPE.replace("extension-", "");

const createOrganizationData = ({
  organizationLicense,
  organizationReference,
  siteName,
  providerOrganizationUrl,
  providerTypeCode,
  providerTypeDisplay,
  organizationType,
}) => {
  if (!organizationType) {
    console.error(
      `organizationType wasn't provided for \`createOrganizationData\` fn`
    );
  }
  const { profileType, idSystem, typeCode } =
    ORGANIZATION_TYPE_VALUES[organizationType];

  return {
    fullUrl: `${providerOrganizationUrl}/${organizationReference}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: ORGANIZATION,
        profileType: profileType,
        uuid: organizationReference,
      }),
      ...(!!providerTypeCode
        ? {
            extension: [
              {
                url: `${BASE_PROFILE_URL}/${EXTENSION_PROVIDER_TYPE}`,
                valueCodeableConcept: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${PROVIDER_TYPE}`,
                      code: providerTypeCode,
                      display: providerTypeDisplay || "",
                    },
                  ],
                },
              },
            ],
          }
        : null),
      identifier: [
        {
          system: idSystem,
          value: organizationLicense,
        },
      ],
      active: true,
      ...(!!typeCode
        ? {
            type: [
              {
                coding: [
                  {
                    system: `${BASE_CODE_SYS_URL}/${ORGANIZATION_TYPE}`,
                    code: typeCode,
                  },
                ],
              },
            ],
          }
        : null),
      name: siteName,
    },
  };
};

export default createOrganizationData;
