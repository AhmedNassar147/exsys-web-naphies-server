/*
 *
 * Helper: `createNaphiesPreauthRequestFullData`.
 *
 */
import { writeResultFile } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createNphiesCoverage from "../base/createNphiesCoverage.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import createNphiesVisionPrescriptionData from "./createNphiesVisionPrescriptionData.mjs";
// import createCoverageEligibilityRequest from "./createCoverageEligibilityRequest.mjs";
// import createLocationData from "./createLocationData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { PREAUTH } = NPHIES_REQUEST_TYPES;

const createNaphiesPreauthRequestFullData = ({
  provider_license,
  request_id,
  payer_license,
  site_url,
  site_tel,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  // provider_location,
  // location_license,
  payer_base_url,
  // purpose,
  coverage_type,
  member_id,
  patient_id,
  national_id,
  national_id_type,
  staff_first_name,
  staff_family_name,
  gender,
  birthDate,
  patient_martial_status,
  subscriber_patient_id,
  subscriber_national_id,
  subscriber_national_id_type,
  subscriber_staff_first_name,
  subscriber_staff_family_name,
  subscriber_gender,
  subscriber_birthDate,
  subscriber_martial_status,
  relationship,
  // period_start_date,
  // period_end_date,
  // business_arrangement,
  network_name,
  classes,
  doctor_id,
  doctor_license,
  doctor_first_name,
  doctor_family_name,
  visionPrescriptionId,
  visionPrescriptionCreatedAt,
  visionLensSpecification,
}) => {
  const {
    providerPatientUrl,
    providerDoctorUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerFocusUrl,
    // providerLocationUrl,
    visionPrescriptionUrl,
  } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType: PREAUTH,
  });

  const baseData = createNphiesBaseRequestData();

  const requestPayload = {
    ...baseData,
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId: request_id,
        providerFocusUrl,
        requestType: PREAUTH,
      }),
      // createCoverageEligibilityRequest({
      //   requestId: request_id,
      //   purpose,
      //   providerOrganization: provider_organization,
      //   payerOrganization: payer_organization,
      //   providerLocation: provider_location,
      //   periodStartDate: period_start_date,
      //   periodEndDate: period_end_date,
      //   patientId: patient_id,
      //   businessArrangement: business_arrangement,
      //   providerPatientUrl,
      //   providerOrganizationUrl,
      //   providerCoverageUrl,
      //   providerFocusUrl,
      //   providerLocationUrl,
      // }),
      createOrganizationData({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        isProvider: true,
      }),
      createNphiesDoctorOrPatientData({
        patientOrDoctorId: patient_id,
        identifierId: national_id,
        identifierIdType: national_id_type,
        staffFirstName: staff_first_name,
        staffFamilyName: staff_family_name,
        staffPhone: site_tel,
        gender,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),

      !!subscriber_patient_id &&
        !!subscriber_national_id &&
        createNphiesDoctorOrPatientData({
          patientOrDoctorId: subscriber_patient_id,
          identifierId: subscriber_national_id,
          identifierIdType: subscriber_national_id_type,
          staffFirstName: subscriber_staff_first_name,
          staffFamilyName: subscriber_staff_family_name,
          staffPhone: site_tel,
          gender: subscriber_gender,
          patientBirthdate: subscriber_birthDate,
          patientMaritalStatus: subscriber_martial_status,
          providerDoctorOrPatientUrl: providerPatientUrl,
        }),
      createOrganizationData({
        organizationLicense: payer_license,
        organizationReference: payer_organization,
        siteName: payer_name,
        providerOrganizationUrl,
      }),
      createNphiesCoverage({
        requestId: request_id,
        coverageType: coverage_type,
        memberId: member_id,
        patientId: patient_id,
        subscriberPatientId: subscriber_patient_id,
        relationship,
        payerOrganization: payer_organization,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        classes,
        // coveragePeriodStart: "2021-08-30",
        // coveragePeriodEnd: "2021-08-30",
        // "period": {
        // 	"start": "2021-08-30",
        // 	"end": "2021-08-30"
        // },
      }),
      createNphiesDoctorOrPatientData({
        patientOrDoctorId: doctor_id,
        identifierId: doctor_license,
        // identifierIdType: "MD",
        staffFirstName: doctor_first_name,
        staffFamilyName: doctor_family_name,
        providerDoctorOrPatientUrl: providerDoctorUrl,
        isPatient: false,
      }),
      !!(visionPrescriptionId && visionPrescriptionCreatedAt) &&
        createNphiesVisionPrescriptionData({
          visionPrescriptionUrl,
          visionPrescriptionId,
          visionPrescriptionCreatedAt,
          visionLensSpecification,
          requestId: request_id,
          providerDoctorUrl,
          providerPatientUrl,
          doctorId: doctor_id,
          dateWritten: baseData.timestamp,
          patientId: patient_id,
        }),
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesPreauthRequestFullData;

await writeResultFile({
  data: createNaphiesPreauthRequestFullData({
    provider_license: "N-F-00003",
    request_id: "298390",
    payer_license: "N-I-00001",
    site_url: "http://saudidentalclinic.com.sa",
    site_tel: "",
    site_name: "Saudi Dentist Clinic",
    provider_organization: "b1b3432921324f97af3be9fd0b1a14ae",
    payer_organization: "bff3aa1fbd3648619ac082357bf135db",
    payer_name: "Saudi National Insurance",
    // provider_location,
    // location_license,
    payer_base_url: "http://payer.com",
    // purpose,
    coverage_type: "EHCPOL",
    member_id: "0000000003",
    patient_id: "3",
    national_id: "0000000003",
    national_id_type: undefined,
    staff_first_name: "Sara",
    staff_family_name: "Khan",
    gender: "female",
    birthDate: "1974-03-13",
    patient_martial_status: undefined,

    subscriber_patient_id: "123454186",
    subscriber_national_id: "0000000001",
    subscriber_national_id_type: undefined,
    subscriber_staff_first_name: "Khaled",
    subscriber_staff_family_name: "Abbas",
    subscriber_gender: "male",
    subscriber_birthDate: "1984-12-25",
    subscriber_martial_status: undefined,

    relationship: "spouse",
    // period_start_date,
    // period_end_date,
    // business_arrangement,
    network_name: "Golden C",
    classes: [
      {
        code: "group",
        value: "CB135",
        name: "Insurance Group A",
      },
      {
        code: "plan",
        value: "ABC123",
        name: "Insurance Group A",
      },
    ],
    doctor_id: "7",
    doctor_license: "N-P-00002",
    doctor_first_name: "Yasser",
    doctor_family_name: "Mahfooz",
    visionPrescriptionId: "2199055",
    visionPrescriptionCreatedAt: "2021-08-28T14:56:49.034+03:00",
    visionLensSpecification: [
      {
        eye: "left",
        sphere: 1.5,
        cylinder: 0.75,
        axis: 110,
        prism: [
          {
            amount: 2,
            base: "up",
          },
        ],
      },
      {
        eye: "right",
        sphere: 2.25,
        cylinder: 0.75,
        axis: 80,
      },
    ],
  }),
});
