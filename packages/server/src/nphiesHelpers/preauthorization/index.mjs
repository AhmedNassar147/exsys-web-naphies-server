/*
 *
 * Helper: `createNaphiesPreauthRequestFullData`.
 *
 */
import {
  writeResultFile,
  isArrayHasData,
  createUUID,
} from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createNphiesCoverage from "../base/createNphiesCoverage.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import createNphiesClaimData from "./createNphiesClaimData.mjs";
import createNphiesVisionPrescriptionData from "./createNphiesVisionPrescriptionData.mjs";
// import createCoverageEligibilityRequest from "./createCoverageEligibilityRequest.mjs";
// import createLocationData from "./createLocationData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { PREAUTH } = NPHIES_REQUEST_TYPES;

const createNaphiesPreauthRequestFullData = ({
  provider_license,
  payer_license,
  payer_child_license,
  site_url,
  site_tel,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  payer_base_url,
  coverage_type,
  coveragePeriodStart,
  coveragePeriodEnd,
  memberid,
  patient_file_no,
  iqama_no,
  national_id_type,
  official_name,
  official_f_name,
  gender,
  birthDate,
  patient_martial_status,
  subscriber_patient_file_no,
  subscriber_iqama_no,
  subscriber_national_id_type,
  subscriber_official_name,
  subscriber_official_f_name,
  subscriber_gender,
  subscriber_birthDate,
  subscriber_martial_status,
  subscriber_tel,
  relationship,
  network_name,
  classes,
  business_arrangement,
  visionPrescriptionId,
  visionPrescriptionCreatedAt,
  visionLensSpecification,
  preauthType,
  supportingInfo,
  doctorsData,
  productsData,
  diagnosisData,
}) => {
  const {
    providerPatientUrl,
    providerDoctorUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerFocusUrl,
    visionPrescriptionUrl,
  } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType: PREAUTH,
  });

  const baseData = createNphiesBaseRequestData();
  const hasDoctorsData = isArrayHasData(doctorsData);
  const buildVisionPrescription = !!(
    visionPrescriptionId && visionPrescriptionCreatedAt
  );

  const primaryDoctorIndex = hasDoctorsData
    ? doctorsData.findIndex(({ roleCode }) => roleCode === "primary")
    : -1;

  const isPrimaryDoctorIndexFound = primaryDoctorIndex !== -1;

  const { id: primaryDoctorId } = isPrimaryDoctorIndexFound
    ? doctorsData[primaryDoctorIndex]
    : {};

  const requestId = createUUID();

  const requestPayload = {
    ...baseData,
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId,
        providerFocusUrl,
        requestType: PREAUTH,
      }),
      createNphiesClaimData({
        requestId,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        patientId: patient_file_no,
        businessArrangement: business_arrangement,
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerFocusUrl,
        siteUrl: site_url,
        visionPrescriptionUrl,
        useVisionPrescriptionUrl: buildVisionPrescription,
        hasDoctorsData,
        primaryDoctorSequence: isPrimaryDoctorIndexFound
          ? primaryDoctorIndex + 1
          : undefined,
        primaryDoctorFocal: isPrimaryDoctorIndexFound ? true : undefined,
        providerDoctorUrl,
        preauthType,
        supportingInfo,
        doctorsData,
        productsData,
        diagnosisData,
      }),
      createNphiesDoctorOrPatientData({
        patientOrDoctorId: patient_file_no,
        identifierId: iqama_no,
        identifierIdType: national_id_type,
        staffFirstName: official_name,
        staffFamilyName: official_f_name,
        staffPhone: site_tel,
        gender,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),
      !!subscriber_patient_file_no &&
        !!subscriber_iqama_no &&
        createNphiesDoctorOrPatientData({
          patientOrDoctorId: subscriber_patient_file_no,
          identifierId: subscriber_iqama_no,
          identifierIdType: subscriber_national_id_type,
          staffFirstName: subscriber_official_name,
          staffFamilyName: subscriber_official_f_name,
          staffPhone: subscriber_tel,
          gender: subscriber_gender,
          patientBirthdate: subscriber_birthDate,
          patientMaritalStatus: subscriber_martial_status,
          providerDoctorOrPatientUrl: providerPatientUrl,
        }),
      createNphiesCoverage({
        requestId,
        coverageType: coverage_type,
        memberId: memberid,
        patientId: patient_file_no,
        subscriberPatientId: subscriber_patient_file_no,
        relationship,
        payerOrganization: payer_organization,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        classes,
        coveragePeriodStart,
        coveragePeriodEnd,
      }),
      hasDoctorsData &&
        doctorsData.map(({ id, license, first_name, family_name }) =>
          createNphiesDoctorOrPatientData({
            patientOrDoctorId: id,
            identifierId: license,
            // identifierIdType: "MD",
            staffFirstName: first_name,
            staffFamilyName: family_name,
            providerDoctorOrPatientUrl: providerDoctorUrl,
            isPatient: false,
          })
        ),
      buildVisionPrescription &&
        createNphiesVisionPrescriptionData({
          visionPrescriptionUrl,
          visionPrescriptionId,
          visionPrescriptionCreatedAt,
          visionLensSpecification,
          requestId,
          providerDoctorUrl,
          providerPatientUrl,
          doctorId: primaryDoctorId,
          dateWritten: baseData.timestamp,
          patientId: patient_file_no,
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
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesPreauthRequestFullData;

// const promises = [
// {
//   folderName: "institutional || pharmacy || professional",
//   data: {
//     payer_license: "N-I-00001",
//     provider_license: "N-F-00001",
//     payer_child_license: undefined,
//     site_url: "http://sgh.sa.com",
//     site_tel: "+966515111691",
//     site_name: "Saudi General Hospital",
//     provider_organization: "b1b3432921324f97af3be9fd0b1a14ae",
//     payer_organization: "bff3aa1fbd3648619ac082357bf135db",
//     payer_name: "Saudi National Insurance",
//     payer_base_url: "http://sni.com.sa",
//     coverage_type: "EHCPOL",
//     patient_file_no: "151116788",
//     memberid: "0000000002",
//     iqama_no: "0000000002",
//     national_id_type: undefined,
//     official_name: "Muhammad",
//     official_f_name: "Ali",
//     gender: "male",
//     birthDate: "2010-08-21",
//     patient_martial_status: undefined,
//     subscriber_patient_file_no: "3662364643",
//     subscriber_iqama_no: "0000000001",
//     subscriber_national_id_type: undefined,
//     subscriber_official_name: "Ahmad",
//     subscriber_official_f_name: "Khaled",
//     subscriber_gender: "male",
//     subscriber_birthDate: "1984-12-25",
//     subscriber_tel: "+966515111643",
//     subscriber_martial_status: undefined,
//     relationship: "child",
//     classes: [
//       {
//         code: "group",
//         value: "CB135",
//         name: "Insurance Group A",
//       },
//     ],
//     network_name: "Golden C",
//     preauthType: "institutional",
//     supportingInfo: [
//       {
//         value: 130,
//         categoryCode: "vital-sign-systolic",
//       },
//     ],
//     doctorsData: [
//       {
//         id: "7",
//         license: "N-P-00001",
//         first_name: "Ameera",
//         family_name: "Hassan",
//         roleCode: "primary",
//         practiceCode: "08.26",
//       },
//     ],
//     productsData: [
//       {
//         nphiesProductCode: "38618-00-00",
//         nphiesProductCodeType: "procedures",
//         nphiesProductName: "Insertion of left and right ventricular assist device",
//         servicedDate: "2021-08-30",
//         quantity: 1,
//         unitPrice: 5000,
//         extensionTax: 750,
//         extensionPatientShare: 0,
//         extensionPackage: "N",
//         diagnosisIds: ['R07.1'],
//         doctorsIds: ['7'],
//       },
//     ],
//     diagnosisData: [
//       {
//         onAdmission: "Y",
//         diagCode: "R07.1",
//         diagType: "principal",
//       },
//     ],
//   },
// },
// {
//   folderName: "preauth/dental",
//   data: {
//     preauthType: "oral",
//   },
// },
// {
//   folderName: "preauth/visionPrescription",
//   data: {
//     preauthType: "vision",
//     visionPrescriptionId: "2199055",
//     visionPrescriptionCreatedAt: "2021-08-28T14:56:49.034+03:00",
//     visionLensSpecification: [
//       {
//         eye: "left",
//         sphere: 1.5,
//         cylinder: 0.75,
//         axis: 110,
//         prism: [
//           {
//             amount: 2,
//             base: "up",
//           },
//         ],
//       },
//       {
//         eye: "right",
//         sphere: 2.25,
//         cylinder: 0.75,
//         axis: 80,
//       },
//     ],
//   },
// },
// ].map(({ folderName, data }) =>
//   writeResultFile({
//     folderName,
//     data: createNaphiesPreauthRequestFullData(data),
//   })
// );

// await Promise.all(promises);
