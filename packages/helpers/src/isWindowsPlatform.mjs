/*
 *
 * Helper: `isWindowsPlatform`.
 *
 */
const isWindowsPlatform = () => ["win32", "win64"].includes(process.platform);

export default isWindowsPlatform;
