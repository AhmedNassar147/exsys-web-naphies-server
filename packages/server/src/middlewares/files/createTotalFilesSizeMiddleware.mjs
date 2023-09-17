/*
 *
 * `createPreauthorizationMiddleware`: `middleware`
 *
 */
import createTotalFilesSizeMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import getTotalFilesSizeMb from "../../helpers/getTotalFilesSizeMb.mjs";

export default createTotalFilesSizeMiddleware(async ({ data }) => {
  const totalSizeMb = await getTotalFilesSizeMb(data);

  return {
    totalSizeMb,
  };
});
