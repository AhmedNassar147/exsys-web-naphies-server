/*
 *
 * Helper: `extractMessageHeaderData`.
 *
 */
const extractMessageHeaderData = ({ eventCoding }) => {
  const { code } = eventCoding || {};

  return {
    messageHeaderRequestType: (code || "").replace(/-response/, ""),
  };
};

export default extractMessageHeaderData;
