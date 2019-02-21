const fs = require("fs").promises;
const path = require("path");

module.exports.exists = async function insert(template) {
  try {
    await fs.stat(path.join(__dirname, `../avtaler/${template}.html`));
    return true;
  } catch (e) {
    return false;
  }
};

module.exports.insert = function insert(template, data) {
  return template.replace(/<%\s*(\w+)\s*%>/gm, function(_, key) {
    if (!data[key]) return "";
    return data[key];
  });
};

module.exports.getTemplate = async function getTemplate(template) {
  const data = await fs.readFile(path.join(__dirname, `${template}.html`));
  return data.toString("utf8");
};

module.exports.save = async function save(file, content) {
  const filename = path.join(__dirname, "..", `${file}.html`);
  return fs.writeFile(filename, content);
};
