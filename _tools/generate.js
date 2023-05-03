const fs = require("fs").promises;
const path = require("path");

const { save, getTemplate, insert, DefaultListMap } = require("./utils");
const Handlebars = require("handlebars");


start();

async function start() {
  await Promise.all([generate("norge"), generate("sverige")]);
}

async function generate(country) {
  try {
    const template = await getTemplate("index_template");
    const documents = await getDocuments(country);

    const headerList = [
      createCountryRadioGroup(country),
      createCollapsibleLists(documents),
    ];

    const result = insert(template, {
      content: headerList.join("\n"),
    });

    save(country === "norge" ? "index" : "sverige", result);

    console.log(`Generated ${country}.html`);
  } catch (e) {
    console.error("Error:", e);
  }
}

function createCountryRadioGroup(country) {
  const norgeActive = country === "norge" ? " active" : "";
  const sverigeActive = country === "sverige" ? " active" : "";

  return `
    <div class="countryRadioGroup">
      <a href="/" class="toggleOption toggleOptionLeft${norgeActive}" aria-current="${country === "norge" ? "page" : ""}" tabindex="0" aria-label="Klikk for å gå til norske avtaler">
        Norge
        <span class="countryRadioButton${norgeActive}" aria-hidden='true'></span>
      </a>

      <a href="/sverige.html" class="toggleOption toggleOptionRight${sverigeActive}" aria-current="${country === "sverige" ? "page" : ""}" tabindex="0" aria-label="Klikk for å gå til svenske avtaler">
      Sverige  
      <span class="countryRadioButton${sverigeActive}" aria-hidden='true'></span>
      </a>
    </div>
  `;
}

function createCollapsibleLists(documentsByType) {
  Handlebars.registerHelper('createItem', function(item) {
    return new Handlebars.SafeString(`
      <article>
        <h3><a href="${item.url}" title="${item.title}">${item.title}</a></h3>
      </article>
    `);
  });
  
  const templateSource = `
    {{#each documentsByType}}
      <div class="collapsibleHeader">
        <h1 class="collapsibleHeaderLeft">{{this.type}}</h1>
        <button class="collapsibleButton" aria-label="{{this.type}} utvid/skjul">
          <span class="arrow"></span>
        </button>
      </div>
      <div class="collapsibleContent" role="region" aria-labelledby="{{this.type}}">
        {{#each this.items}}
          <div class="collapsibleItem">
            {{createItem this}}
          </div>
        {{/each}}
      </div>
    {{/each}}
  `;

  const template = Handlebars.compile(templateSource);

  return template({
    documentsByType: documentsByType.entryList().sort(
      ([type1, items1], [type2, items2]) =>
        (items1[0].order || Infinity) - (items2[0].order || Infinity)
    ).map(([type, items]) => ({ type, items })),
  });
}


async function getDocuments(country) {
  const dir = path.join(__dirname, "..", "avtaler", country);
  const typeDirs = (await fs.readdir(dir)).map((i) => path.join(dir, i));
  const documentsByType = new DefaultListMap();

  for (let typeDir of typeDirs) {
    const typeDirStat = await fs.stat(typeDir);

    if (!typeDirStat.isDirectory()) {
      continue;
    }

    const metaFile = path.join(typeDir, "meta.json");

    if (await fileExists(metaFile)) {
      const metaContent = await fs.readFile(metaFile, "utf-8");
      const { name, order } = JSON.parse(metaContent);
      const type = name || path.basename(typeDir);
      const contents = (await fs.readdir(typeDir)).map((i) =>
        path.join(typeDir, i)
      );

      for (let content of contents) {
        if (path.basename(content) === "meta.json") {
          continue;
        }

        const title = await getAttribute(content, "title");
        const url = `/avtaler/${country}/${path.basename(
          typeDir
        )}/${path.basename(content)}`;

        documentsByType.set(type, { title, url, order });
      }
    } else {
      const type = path.basename(typeDir);
      const contents = (await fs.readdir(typeDir)).map((i) =>
        path.join(typeDir, i)
      );

      for (let content of contents) {
        if (path.basename(content) === "meta.json") {
          continue;
        }

        const title = await getAttribute(content, "title");
        const url = `/avtaler/${country}/${path.basename(
          typeDir
        )}/${path.basename(content)}`;

        documentsByType.set(type, { title, url });
      }
    }
  }

  return documentsByType;
}

async function getAttribute(filename, attribute) {
  const regex = new RegExp(`<${attribute}>(.*)<\/${attribute}>`);
  const content = await fs.readFile(filename);
  const result = regex.exec(content);

  if (!result) {
    return path.basename(filename);
  }

  return result[1];
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
