/*
 *
 * Helper: `capitalizeFirstLetter`.
 *
 */
const capitalizeFirstLetter = (value) =>
  (value && value[0].toUpperCase() + value.slice(1)) || undefined;

export default capitalizeFirstLetter;
