/*
 *
 * Helper: `collectProcessOptionsSync`.
 *
 */
import toCamelCase from "./toCamelCase.mjs";

const helpKeyRegex = /--h$|--help$/gim;

const collectProcessOptionsSync = () => {
  const argv = process.argv.slice(2) || [];

  if (!argv.length) {
    return {
      hasOptions: false,
    };
  }

  const shouldDisplayHelpMessage = argv.some((key) => helpKeyRegex.test(key));

  let computedArgs = {
    hasOptions: true,
    shouldDisplayHelpMessage: shouldDisplayHelpMessage,
  };

  const computedArgv = shouldDisplayHelpMessage
    ? argv.filter((key) => !helpKeyRegex.test(key))
    : argv;

  computedArgv.forEach((key) => {
    key = key.replace(/\s/gm, "");
    const isBooleanOption = !key.includes("=");

    const [keyName, value] = (isBooleanOption ? ` ${key}=true` : key).split(
      "="
    );

    let properKeyName = keyName.replace(/--|\s/g, "");
    // if it's name-param => nameParam
    // if it's --name => name
    properKeyName = toCamelCase(properKeyName);

    const valuesArray = value.split(",");

    const valueLength = valuesArray.length;
    const isOptionValueOption = valueLength === 1;

    const actualValue = isOptionValueOption ? valuesArray[0] : valuesArray;

    const valueIsBooleanString =
      isOptionValueOption &&
      ["true", "false"].includes(actualValue.toLowerCase());

    computedArgs[properKeyName] = valueIsBooleanString
      ? actualValue === "true"
        ? true
        : false
      : actualValue;
  });

  return computedArgs;
};

export default collectProcessOptionsSync;
