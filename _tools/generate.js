const fs = require("fs").promises;
const path = require("path");

const { save, getTemplate, insert } = require("./utils");

start();

async function start() {
  try {
    const template = await getTemplate("index_template");
    const documents = await getDocuments();
    const documentItems = documents.map(createItem);

    const result = insert(template, {
      content: documentItems
    });

    save("index", result);

    console.log("Generated index.html");
  } catch (e) {
    console.error("Error:", e);
  }
}

function createItem(item) {
  return `
  <article>
    <h3><a href="${item.url}" title="${item.title}">${item.title}</a></h3>
  </article>
`;
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
