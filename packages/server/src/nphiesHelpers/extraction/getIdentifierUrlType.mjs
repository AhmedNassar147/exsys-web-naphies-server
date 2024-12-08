/*
 *
 * Helper: `getIdentifierUrlType`.
 *
 */
import { getLastPartOfUrl } from "@exsys-web-server/helpers";
import extractIdentifierData from "./extractIdentifierData.mjs";

const getIdentifierUrlType = (identifier) => {
  const [, system] = extractIdentifierData(identifier);
  const type = getLastPartOfUrl(system);
  return type || undefined;
};

export default getIdentifierUrlType;
