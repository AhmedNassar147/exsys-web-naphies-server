/*
 *
 * Helper: `extractMessageHeaderData`.
 *
 */
const extractMessageHeaderData =
  (messageHeaderReplacedRegexp = /-response/) =>
  ({ resource: { eventCoding } }) => {
    const { code } = eventCoding || {};

    return {
      messageHeaderRequestType: (code || "").replace(
        messageHeaderReplacedRegexp,
        ""
      ),
    };
  };

export default extractMessageHeaderData;
