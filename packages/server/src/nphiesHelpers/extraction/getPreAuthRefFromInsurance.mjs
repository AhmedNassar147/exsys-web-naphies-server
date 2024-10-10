/*
 *
 * Helper: `getPreAuthRefFromInsurance`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";

const getPreAuthRefFromInsurance = (insurance) => {
  if (isArrayHasData(insurance)) {
    return insurance
      .reduce((acc, { preAuthRef }) => acc.concat(preAuthRef), [])
      .filter(Boolean)
      .join(" , ");
  }

  return "";
};

export default getPreAuthRefFromInsurance;
