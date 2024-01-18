/*
 *
 * Helper: `submitScrapingForm`.
 *
 */
const submitScrapingForm = async (
  page,
  submissionSelector,
  navigationOptions
) =>
  await Promise.all([
    page.waitForNavigation(navigationOptions), // The promise resolves after navigation has finished
    page.evaluate(
      (selector) => document.querySelector(selector).click(), // click the submission button
      submissionSelector
    ),
  ]);

export default submitScrapingForm;
