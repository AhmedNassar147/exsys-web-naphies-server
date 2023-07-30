/*
 *
 * Helper: `getValueFromObject`.
 *
 */
const getValueFromObject = (objectValue, keyName = "value") =>
  objectValue ? objectValue[keyName] : undefined;

export default getValueFromObject;
