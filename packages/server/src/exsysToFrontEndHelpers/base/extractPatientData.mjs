/*
 *
 * helper: `extractPatientData`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractPatientData = ({
  resource: { id, identifier, name, telecom, gender, birthDate },
}) => {
  const [firstItem] = identifier || [];
  const { type } = firstItem || {};

  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);
  const [{ text }] = name || [{}];
  const [{ value: patientPhone }] = telecom || [{}];

  return {
    patientFileNo: id,
    patientName: text,
    patientBirthDate: birthDate,
    patientGender: gender,
    patientPhone,
    patientIdentifierIdType: [code, display].filter(Boolean).join(" - "),
  };
};

export default extractPatientData;
