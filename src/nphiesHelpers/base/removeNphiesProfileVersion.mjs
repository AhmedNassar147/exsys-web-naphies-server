/*
 *
 * Helper: `removeNphiesProfileVersion`.
 *
 */
const removeNphiesProfileVersion = (profileTypeWithVersion) =>
  profileTypeWithVersion.replace(/\|.+/g, "");

export default removeNphiesProfileVersion;
