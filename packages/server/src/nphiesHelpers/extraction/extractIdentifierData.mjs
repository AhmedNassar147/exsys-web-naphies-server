/*
 *
 * Helper: `extractIdentifierData`.
 *
 */
import { isArrayHasData, isObjectHasData } from "@exsys-web-server/helpers";

const extractIdentifierData = (identifier) => {
  if (isArrayHasData(identifier)) {
    const [{ value, system }] = identifier;
    return [value, system];
  }

  if (isObjectHasData(identifier)) {
    const { value, system } = identifier;
    return [value, system];
  }

  return [];
};

export default extractIdentifierData;
