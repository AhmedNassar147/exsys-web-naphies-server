/*
 *
 * helper: `extractPatientData`.
 *
 */
import { createDateFromNativeDate } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractPatientData = ({
  resource: { id, identifier, name, telecom, gender, birthDate, maritalStatus },
}) => {
  const [firstItem] = identifier || [];
  const { type, value: identifierValue } = firstItem || {};

  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);
  const [{ text }] = name || [{}];
  const [{ value: patientPhone }] = telecom || [{}];

  const { code: maritalStatusCode } =
    extractNphiesCodeAndDisplayFromCodingType(maritalStatus);

  const { dateString } = createDateFromNativeDate(birthDate, {
    returnReversedDate: false,
  });

  return {
    patientFileNo: id,
    patientName: text,
    patientBirthDate: dateString,
    patientGender: gender,
    patientPhone,
    patientIdentifierIdType: `${display} (${code})`,
    patientIdentifierId: identifierValue,
    maritalStatusCode,
  };
};

export default extractPatientData;
