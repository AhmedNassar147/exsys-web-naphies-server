/*
 *
 * Helper: `createTimestamp`.
 *
 */

const createTimestamp = (date) => {
  const __date = (Array.isArray(date) ? date : [date]).filter(Boolean);

  return new Date(...__date).toISOString();
};

export default createTimestamp;
