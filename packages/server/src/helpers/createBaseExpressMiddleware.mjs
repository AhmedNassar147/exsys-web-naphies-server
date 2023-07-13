/*
 *
 * Helper: `createBaseExpressMiddleware`.
 *
 */
const createBaseExpressMiddleware =
  (makeFetchRequest) => (app) => async (req, _, next) => {
    const { originalUrl } = req;

    app.post(originalUrl, async (req, res) => {
      const { body } = req;

      const apiResults = await makeFetchRequest(body, originalUrl);

      res
        .header("Content-type", "application/json")
        .status(200)
        .json(apiResults)
        .end();
    });

    next();
  };

export default createBaseExpressMiddleware;
