const fs = require("fs").promises;
const path = require("path");

start();

async function start() {
  try {
    const template = await getTemplate();
    const documents = await getDocuments();
    const documentItems = documents.map(createItem);

    const result = insert(template, {
      content: documentItems
    });

    save(result);

    console.log("Generated index.html");
  } catch (e) {
    console.error("Error:", e);
  }
}

function insert(template, data) {
  return template.replace(/<%\s*(\w+)\s*%>/gm, function(_, key) {
    if (!data[key]) return "";
    return data[key];
  });
}

function createItem(item) {
  return `
  <article>
    <h3><a href="${item.url}" title="${item.title}">${item.title}</a></h3>
  </article>
`;
}

async function getTemplate() {
  const data = await fs.readFile(path.join(__dirname, "index_template.html"));
  return data.toString("utf8");
}

async function save(content) {
  const filename = path.join(__dirname, "..", "index.html");
  return fs.writeFile(filename, content);
}

async function getDocuments() {
  const dir = path.join(__dirname, "..", "avtaler");
  const contents = (await fs.readdir(dir)).map(i => path.join(dir, i));

  let result = [];
  for (let item of contents) {
    const title = await getTitle(item);
    result.push({
      title,
      url: `/avtaler/${path.basename(item)}`
    });
  }
  return result;
}

async function getTitle(filename) {
  const regex = /<title>(.*)<\/title>/i;
  const content = await fs.readFile(filename);
  const result = regex.exec(content);

  if (!result) {
    return path.basename(filename);
  }

  return result[1];
}
