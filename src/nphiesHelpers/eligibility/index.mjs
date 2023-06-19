/*
 *
 * Helper: `createNaphiesRequestFullData`.
 *
 */
import createNphiesMessageHeader from "./createNphiesMessageHeader.mjs";
import createCoverageEligibilityRequest from "./createCoverageEligibilityRequest.mjs";
import createNphiesCoverage from "./createNphiesCoverage.mjs";
import createNphiesPatientData from "./createNphiesPatientData.mjs";
import createEligibilityOrganization from "./createEligibilityOrganization.mjs";
import createLocationData from "./createLocationData.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createProviderUrls from "../base/createProviderUrls.mjs";

const createNaphiesRequestFullData = ({
  provider_license,
  request_id,
  payer_license,
  site_url,
  site_tel,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  provider_location,
  location_license,
  payer_base_url,
  purpose,
  priority_code = "normal",
  coverage_type,
  coverage_id,
  member_id,
  patient_id,
  national_id,
  national_id_type = "PRC",
  staff_first_name,
  staff_family_name,
  gender,
  birthDate,
  patient_martial_status,
  relationship,
  period_start_date,
  period_end_date,
  business_arrangement,
  network_name,
  coverage_classes,
}) => {
  const {
    providerPatientUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerCoverageEligibilityUrl,
    providerMessageHeaderUrl,
    providerLocationUrl,
  } = createProviderUrls(site_url);

  const requestPayload = {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId: request_id,
        payerOrganization: payer_organization,
        providerCoverageEligibilityUrl,
        providerMessageHeaderUrl,
      }),
      createCoverageEligibilityRequest({
        requestId: request_id,
        purpose,
        priorityCode: priority_code,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        providerLocation: provider_location,
        periodStartDate: period_start_date,
        periodEndDate: period_end_date,
        coverageId: coverage_id,
        patientId: patient_id,
        businessArrangement: business_arrangement,
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerCoverageEligibilityUrl,
        providerLocationUrl,
      }),
      createNphiesCoverage({
        coverageId: coverage_id,
        coverageType: coverage_type,
        memberId: member_id,
        patientId: patient_id,
        relationship,
        payerOrganization: payer_organization,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        coverageClasses: coverage_classes,
      }),
      createEligibilityOrganization({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        isProvider: true,
      }),
      createEligibilityOrganization({
        organizationLicense: payer_license,
        organizationReference: payer_organization,
        siteName: payer_name,
        providerOrganizationUrl,
      }),
      createNphiesPatientData({
        patientId: patient_id,
        nationalId: national_id,
        nationalIdType: national_id_type,
        staffFirstName: staff_first_name,
        staffFamilyName: staff_family_name,
        staffPhone: site_tel,
        patientGender: gender,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerPatientUrl,
      }),
      createLocationData({
        locationLicense: location_license,
        siteName: site_name,
        providerLocation: provider_location,
        providerOrganization: provider_organization,
        providerLocationUrl,
        providerOrganizationUrl,
      }),
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesRequestFullData;
