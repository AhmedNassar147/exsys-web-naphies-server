/*
 *
 * Helper: `createCmdMessage`.
 *
 */
import chalk from "chalk";

const CHALK_COLOR = {
  error: "red",
  success: "green",
  info: "cyan",
};

const createCmdMessage = ({ type, message, data }) => {
  const params = [
    `${chalk.bold.magenta("[exsys-nphies-web-server]:")} ${chalk[
      CHALK_COLOR[type]
    ](message)}`,
    data ? JSON.stringify(data) : undefined,
  ].filter(Boolean);

  return console.log(...params);
};

export default createCmdMessage;
