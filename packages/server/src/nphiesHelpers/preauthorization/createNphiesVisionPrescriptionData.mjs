/*
 *
 * Helpers: `createNphiesVisionPrescriptionData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_API_URLS,
} from "../../constants.mjs";

const { BASE_CODE_SYS_URL } = NPHIES_API_URLS;
const { LENSE_TYPE } = NPHIES_BASE_CODE_TYPES;

const { PROFILE_VISION_PRESCRIPTION } = NPHIES_BASE_PROFILE_TYPES;
const { VISION_PRESCRIPTION } = NPHIES_RESOURCE_TYPES;

const createNphiesVisionPrescriptionData = ({
  visionPrescriptionUrl,
  visionPrescriptionId,
  visionPrescriptionCreatedAt,
  requestId,
  providerDoctorUrl,
  doctorId,
  dateWritten,
  providerPatientUrl,
  patientId,
  visionLensSpecification,
}) => ({
  fullUrl: `${visionPrescriptionUrl}/${requestId}`,
  resource: {
    ...createNphiesBaseResource({
      resourceType: "VisionPrescription",
      profileType: PROFILE_VISION_PRESCRIPTION,
      uuid: requestId,
    }),
    identifier: [
      {
        system: visionPrescriptionUrl.replace(
          VISION_PRESCRIPTION,
          VISION_PRESCRIPTION.toLowerCase()
        ),
        value: visionPrescriptionId,
      },
    ],
    status: "active",
    created: visionPrescriptionCreatedAt,
    patient: {
      reference: `${providerPatientUrl}/${patientId}`,
    },
    dateWritten: dateWritten,
    prescriber: {
      reference: `${providerDoctorUrl}/${doctorId}`,
    },
    lensSpecification: isArrayHasData(visionLensSpecification)
      ? visionLensSpecification.map(
          ({ eye, sphere, cylinder, axis, prism, lensType }) => ({
            product: {
              coding: [
                {
                  system: `${BASE_CODE_SYS_URL}/${LENSE_TYPE}`,
                  code: lensType,
                },
              ],
            },
            eye,
            sphere,
            cylinder,
            axis,
            prism: isArrayHasData(prism) ? prism : undefined,
          })
        )
      : undefined,
  },
});

export default createNphiesVisionPrescriptionData;
