/*
 *
 * Helper: `extractMessageHeaderData`.
 *
 */
const extractMessageHeaderData =
  (messageHeaderReplacedRegexp = /-response/) =>
  ({ resource: { eventCoding, response } }) => {
    const { code } = eventCoding || {};

    const { identifier, code: responseCode } = response || {};

    return {
      messageHeaderRequestType: (code || "").replace(
        messageHeaderReplacedRegexp,
        ""
      ),

      messageHeaderResponseIdentifier: identifier,
      messageHeaderResponseCode: responseCode,
    };
  };

export default extractMessageHeaderData;
