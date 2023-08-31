/*
 *
 * Helper: `createNphiesPreauthOrClaimPollData`.
 *
 */
import { createUUID } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesTaskData from "../base/createNphiesTaskData.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { POLL } = NPHIES_REQUEST_TYPES;

const createNphiesPreauthOrClaimPollData = ({
  providerLicense,
  providerOrganization,
  siteUrl,
  siteName,
  usePollMessageInput,
}) => {
  const requestId = createUUID();

  const { providerOrganizationUrl, providerFocusUrl } = createProviderUrls({
    providerBaseUrl: siteUrl,
    requestType: POLL,
  });

  return {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense,
        requestId,
        providerFocusUrl,
        requestType: POLL,
      }),
      createNphiesTaskData({
        providerOrganization,
        requestId,
        providerFocusUrl,
        requestType: POLL,
        usePollMessageInput,
      }),
      createOrganizationData({
        organizationLicense: providerLicense,
        organizationReference: providerOrganization,
        siteName,
        providerOrganizationUrl,
        isProvider: true,
      }),
    ],
  };
};

export default createNphiesPreauthOrClaimPollData;
