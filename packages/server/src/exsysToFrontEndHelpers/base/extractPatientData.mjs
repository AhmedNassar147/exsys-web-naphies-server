/*
 *
 * helper: `extractPatientData`.
 *
 */
import { createDateFromNativeDate } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractPatientData = ({
  resource: { id, identifier, name, telecom, gender, birthDate },
}) => {
  const [firstItem] = identifier || [];
  const { type } = firstItem || {};

  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);
  const [{ text }] = name || [{}];
  const [{ value: patientPhone }] = telecom || [{}];

  const { dateString } = createDateFromNativeDate(birthDate, {
    returnReversedDate: false,
  });

  return {
    patientFileNo: id,
    patientName: text,
    patientBirthDate: dateString,
    patientGender: gender,
    patientPhone,
    patientIdentifierIdType: [code, display].filter(Boolean).join(" - "),
  };
};

export default extractPatientData;
