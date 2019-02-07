const ce = document.createElement.bind(document);
const sel = document.querySelector.bind(document);
const sela = document.querySelectorAll.bind(document);

const modifiers = {
  formatDate(i) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    return new Date(i).toLocaleDateString("nb-NO", options);
  },
  identity(i) {
    return i;
  }
};

window.addEventListener("load", function() {
  const main = sel("main");
  const fields = getFields(main);
  prefillCustomElementsWithQuery(fields);

  const form = constructForm(fields, updateUrlBox);
  document.body.insertBefore(form, main);

  updateUrlBox();
});

function getFields() {
  return Array.from(sela("v-field"));
}
function getInputs() {
  return Array.from(sela("input")).filter(i => i.id.indexOf("input-") === 0);
}
function getFieldsOfType(selector) {
  return Array.from(sela(`v-field[title='${selector}']`));
}
function getObjectFromFields() {
  let obj = {};
  for (let field of getInputs()) {
    obj[field.id] = field.value;
  }
  return obj;
}

function prefillCustomElementsWithQuery(fields) {
  const defaultValues = queryToObject();

  fields.forEach(function updateDefaultValues(field) {
    const slug = "input-" + slugify(field.getAttribute("title"));
    const data = defaultValues[slug];
    if (!slug || !data) return;
    field.textContent = defaultValues[slug];
  });
}

function updateValue(field, value) {
  const title = field.getAttribute("title");
  getFieldsOfType(title).forEach(function(el) {
    const formatter = getFormatter(el.getAttribute("format"));
    el.textContent = formatter(value);
  });
}

function updateUrlBox() {
  const updateBox = document.querySelector("#urlbox");
  const data = getObjectFromFields();
  const url = objectToUrl(data);
  updateBox.value = url;
}

function constructForm(fields, cb) {
  const form = ce("form");
  const ul = ce("ul");

  const updateDecoration = (...args) => {
    cb();
    updateValue(...args);
  };

  unique(fields)
    .map(createConstructInputLi(updateDecoration))
    .forEach(ul.appendChild.bind(ul));

  const urlBox = createUrlBox();
  ul.appendChild(urlBox);
  form.appendChild(ul);
  return form;
}

function createUrlBox() {
  const label = ce("label");
  label.setAttribute("for", "urlbox");
  label.textContent = "URL";

  const input = ce("input");
  input.name = "urlbox";
  input.id = "urlbox";
  input.type = "text";
  input.value = "";
  input.readOnly = true;

  const li = ce("li");
  li.appendChild(label);
  li.appendChild(input);
  return li;
}

function createConstructInputLi(cb) {
  return function(field) {
    const label = ce("label");
    const title = field.getAttribute("title");
    const slug = slugify(title);
    const id = "input-" + slug;

    label.setAttribute("for", id);
    label.textContent = title;

    const input = ce("input");
    input.name = id;
    input.id = id;
    input.type = field.getAttribute("type");
    input.value = field.textContent;
    input.required = true;

    const li = ce("li");
    li.appendChild(label);
    li.appendChild(input);

    input.addEventListener("input", function(e) {
      const val = e.currentTarget.value;
      cb(field, val);
    });

    return li;
  };
}

function getFormatter(name) {
  const modifierName = modifiers[name] ? name : "identity";
  return modifiers[modifierName];
}

function unique(fields) {
  const visited = [];
  return fields.reduce(function(acc, item) {
    if (visited.includes(item.getAttribute("title"))) return acc;
    visited.push(item.getAttribute("title"));
    return acc.concat(item);
  }, []);
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "-")
    .replace(/[\s\W-]+/g, "-");
}

function queryToObject() {
  const params = new URLSearchParams(document.location.search);
  let obj = {};
  for (let [key, val] of params) {
    obj[key] = val;
  }

  return obj;
}

function objectToUrl(obj) {
  const params = new URLSearchParams();
  for (let key of Object.keys(obj)) {
    if (obj[key]) params.set(key, obj[key]);
  }
  return getUrl() + "?" + params.toString();
}

function getUrl() {
  return document.location.href.split("?")[0];
}
