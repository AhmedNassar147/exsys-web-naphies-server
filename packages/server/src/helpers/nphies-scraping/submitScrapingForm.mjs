/*
 *
 * Helper: `submitScrapingForm`.
 *
 */
const submitScrapingForm = async (page, submissionSelector) =>
  await Promise.all([
    page.waitForNavigation(), // The promise resolves after navigation has finished
    await page.evaluate(
      (selector) => document.querySelector(selector).click(), // click the submission button
      submissionSelector
    ),
  ]);

export default submitScrapingForm;
