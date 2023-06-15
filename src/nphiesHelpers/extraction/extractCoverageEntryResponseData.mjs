/*
 *
 * Helper: `extractCoverageEntryResponseData`.
 *
 */
const extractCoverageEntryResponseData = ({
  resourceType,
  id,
  identifier,
  status,
  class: coverageClass,
}) => {
  const [{ value: memberid }] = identifier || [{}];
  const [{ value: payor }] = coverageClass || [{}];

  return {
    resourceType,
    responseId: id,
    status,
    memberid,
    payor,
    // '$.resource.costToBeneficiary.valueQuantity.value' ,
    copayPct: undefined,
    // '$.resource.costToBeneficiary.valueQuantity.code' ,
    copayPctCode: undefined,
    // '$.resource.costToBeneficiary.valueMoney.value'  ,
    maxCopay: undefined,
    // '$.resource.costToBeneficiary.valueMoney.currency'
    currency: undefined,
  };
};

export default extractCoverageEntryResponseData;
