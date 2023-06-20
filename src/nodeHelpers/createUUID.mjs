/*
 *
 * Helpers: `createUUID`.
 *
 */
const createUUID = () => {
  const hex = "0123456789EXSYSF";
  const model = "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx";
  var str = "";
  for (var i = 0; i < model.length; i++) {
    var rnd = Math.floor(Math.random() * hex.length);
    str += model[i] == "x" ? hex[rnd] : model[i];
  }
  return str.toLowerCase();
};

export default createUUID;
