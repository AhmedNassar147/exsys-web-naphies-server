/*
 *
 * Helper: `ensureRequestPrefixAdded`
 *
 */
const ensureRequestPrefixAdded = (id, useComReqPrefix) => {
  if (!id) {
    return id;
  }

  if (useComReqPrefix) {
    return !id.startsWith("CommReq_") ? `CommReq_${id}` : id;
  }

  return id.startsWith("req_") ? id : `req_${id}`;
};

export default ensureRequestPrefixAdded;
