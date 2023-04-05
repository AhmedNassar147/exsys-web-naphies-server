/*
 *
 * Helper: `makeEligibilityRequest`.
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

const makeEligibilityRequest = async ({
  provider_license,
  provider_organization_reference,
  provider_organization_name,
  payer_license,
  payer_organization_reference,
  payer_organization_name,
  provider_base_url,
  provider_location_reference,
  location_license,
  location_name,
  payer_base_url,
  request_id,
  purpose,
  priority_code,
  coverage_type,
  coverage_id,
  member_id,
  patient_id,
  national_id,
  national_id_type,
  staff_first_name,
  staff_middle_name,
  staff_last_name,
  staff_family_name,
  staff_phone,
  patient_gender,
  patient_birthdate,
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
  } = createProviderUrls(provider_base_url);

  const requestPayload = {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId: request_id,
        providerCoverageEligibilityUrl,
        providerMessageHeaderUrl,
      }),
      createCoverageEligibilityRequest({
        requestId: request_id,
        purpose,
        priorityCode: priority_code,
        providerOrganizationReference: provider_organization_reference,
        payerOrganizationReference: payer_organization_reference,
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
        providerLocationReference: provider_location_reference,
      }),
      createNphiesCoverage({
        coverageId: coverage_id,
        coverageType: coverage_type,
        memberId: member_id,
        patientId: patient_id,
        relationship,
        payerOrganizationReference: payer_organization_reference,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        coverageClasses: coverage_classes,
      }),
      createEligibilityOrganization({
        organizationLicense: provider_license,
        organizationReference: provider_organization_reference,
        organizationName: provider_organization_name,
        providerOrganizationUrl,
        isProvider: true,
      }),
      createEligibilityOrganization({
        organizationLicense: payer_license,
        organizationReference: payer_organization_reference,
        organizationName: payer_organization_name,
        providerOrganizationUrl,
      }),
      createNphiesPatientData({
        patientId: patient_id,
        nationalId: national_id,
        nationalIdType: national_id_type,
        staffFirstName: staff_first_name,
        staffMiddleName: staff_middle_name,
        staffLastName: staff_last_name,
        staffFamilyName: staff_family_name,
        staffPhone: staff_phone,
        patientGender: patient_gender,
        patientBirthdate: patient_birthdate,
        patientMaritalStatus: patient_martial_status,
        providerPatientUrl,
      }),
      createLocationData({
        locationLicense: location_license,
        locationName: location_name,
        providerLocationReference: provider_location_reference,
        locationManagingOrganization: provider_organization_reference,
        providerLocationUrl,
        providerOrganizationUrl,
      }),
    ],
  };

  console.log("requestPayload", requestPayload);
};

export default makeEligibilityRequest;
