/*
 *
 * Helper: `extractMessageHeaderData`.
 *
 */
const extractMessageHeaderData = ({ resource: { eventCoding } }) => {
  const { code } = eventCoding || {};

  return {
    messageHeaderRequestType: (code || "").replace(/-response/, ""),
  };
};

export default extractMessageHeaderData;
