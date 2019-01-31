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

class Field extends HTMLElement {
  constructor() {
    super();
  }
}
customElements.define("v-field", Field);

window.addEventListener("load", function() {
  const main = sel("main");
  const fields = getFields(main);
  const form = constructForm(fields);
  document.body.insertBefore(form, main);
});

function getFields(selector) {
  return Array.from(sela("v-field"));
}
function getFieldsOfType(selector) {
  return Array.from(sela(`v-field[title='${selector}']`));
}

function updateValue(field, value) {
  const title = field.getAttribute("title");
  getFieldsOfType(title).forEach(function(el) {
    const formatter = getFormatter(el.getAttribute("format"));
    el.textContent = formatter(value);
  });
}

function constructForm(fields) {
  const form = ce("form");
  const ul = ce("ul");

  unique(fields)
    .map(createConstructInputLi(updateValue))
    .forEach(ul.appendChild.bind(ul));

  form.appendChild(ul);

  return form;
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
