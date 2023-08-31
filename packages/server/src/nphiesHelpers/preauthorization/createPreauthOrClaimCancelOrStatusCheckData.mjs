/*
 *
 * Helper: `createPreauthOrClaimCancelOrStatusCheckData`.
 *
 */
import { createUUID } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesTaskData from "../base/createNphiesTaskData.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";

const createNphiesPreauthOrClaimStatusCheckData = ({
  site_url,
  site_name,
  provider_license,
  provider_organization,
  payer_organization,
  payer_license,
  payer_child_license,
  payer_name,
  operationRequestId,
  requestType,
  cancellationReasonCode,
  focus_type,
  nullifyRequest,
}) => {
  const requestId = createUUID();

  const { providerOrganizationUrl, providerFocusUrl } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType,
  });

  return {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId,
        providerFocusUrl,
        requestType,
      }),
      createNphiesTaskData({
        providerOrganization: provider_organization,
        requestId,
        providerFocusUrl,
        requestType,
        payerOrganization: payer_organization,
        siteUrl: site_url,
        operationRequestId,
        cancellationReasonCode,
        focusType: focus_type,
        nullifyRequest: nullifyRequest === "Y",
      }),
      createOrganizationData({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        isProvider: true,
      }),
      createOrganizationData({
        organizationLicense: payer_child_license || payer_license,
        organizationReference: payer_organization,
        siteName: payer_name,
        providerOrganizationUrl,
      }),
    ],
  };
};

export default createNphiesPreauthOrClaimStatusCheckData;
