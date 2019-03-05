function createUiFramework() {
  const isEvent = k => k.indexOf("on") === 0;
  const eventName = k => k.substr(2).toLowerCase();
  function attrs(el, obj) {
    for (let k in obj) {
      if (isEvent(k)) {
        el.addEventListener(eventName(k), obj[k]);
      } else if (k !== "class") {
        el.setAttribute(k, obj[k]);
      } else {
        const classes = Array.isArray(obj[k]) ? obj[k] : [obj[k]];
        el.classList.add(...classes);
      }
    }
    return el;
  }
  return new Proxy(
    {},
    {
      get(_, element) {
        return function createElement(obj = {}, children = []) {
          if (Array.isArray(obj)) {
            children = obj;
            obj = {};
          }
          const el = attrs(document.createElement(element), obj);
          children.forEach(function(i) {
            if (typeof i === "string") {
              el.textContent = i;
            } else {
              el.appendChild(i);
            }
          });
          return el;
        };
      }
    }
  );
}
const ui = createUiFramework();
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
  insertCss();

  const main = sel("main");

  const logo = createLogo();
  main.querySelector("article").appendChild(logo);

  const fields = getFields(main);
  prefillCustomElementsWithQuery(fields);

  const lists = getLists();

  const top = container(constructForm(fields, lists, updateUrlBox));

  document.body.addEventListener("click", function(e) {
    if (isInContainer(e.target, top)) return;
    top.classList.remove("var-injector--open");
  });

  document.body.insertBefore(top, main);
  updateUrlBox();
});

function getLists() {
  return Array.from(sela("[data-vlist='loop']"));
}

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

function constructForm(fields, lists, cb) {
  const { form, ul } = ui;
  const updateDecoration = (...args) => {
    cb();
    updateValue(...args);
  };
  return form([
    ul([
      ...unique(fields).map(createConstructInputLi(updateDecoration)),
      ...constructListsInput(lists, updateDecoration),
      createUrlBox()
    ])
  ]);
}

function createUrlBox() {
  const { label, input, button, li } = ui;
  const inputEl = input({
    name: "urlbox",
    id: "urlbox",
    type: "text",
    value: "",
    readOnly: true
  });

  return li({ class: "url-box" }, [
    label({ for: "urlbox" }, ["Generert URL som kan kopieres"]),
    inputEl,
    button(
      {
        type: "button",
        onClick() {
          inputEl.select();
          document.execCommand("copy");
          alert("Kopiert til clipboard"); // Hah! Alert!
        }
      },
      ["COPY"]
    )
  ]);
}

function constructListsInput(lists, update) {
  const { div, input, label, fieldset, legend, ul, li, button } = ui;

  return lists.map(function(list) {
    const listTitle = list.getAttribute("data-title");
    const listSlug = slugify(listTitle);
    const inputLi = children => li({ class: "loop_li" }, children);

    function removable(children) {
      const el = inputLi([
        ...children,
        button(
          {
            title: "Fjern rad",
            type: "button",
            class: "loop_removeRow",
            onClick(e) {
              e.stopPropagation();
              el.remove();
            }
          },
          ["✗"]
        )
      ]);
      return el;
    }

    function createItem(field, i) {
      const title = field.getAttribute("title");
      const slug = slugify(title);
      const id = `input-${listSlug}-${slug}-${i}`;

      return div([
        label({ for: id }, [title]),
        input({
          name: id,
          id: id,
          name: `${slug}[${i}]`,
          type: field.getAttribute("type") || "text",
          value: field.textContent,
          required: true,
          onInput() {
            update();
          }
        })
      ]);
    }

    let items = () =>
      Array.from(list.querySelectorAll("v-item")).map(createItem);
    const rows = ul([inputLi(items())]);

    function newRow() {
      rows.appendChild(removable(items()));
    }

    return fieldset(
      {
        class: "loop"
      },
      [
        legend([listTitle]),
        rows,
        button(
          {
            onClick: newRow,
            type: "button",
            class: "loop_addRow"
          },
          ["Nye verdier"]
        )
      ]
    );
  });
}

function createConstructInputLi(cb) {
  const { li, input, label } = ui;
  return function(field) {
    const title = field.getAttribute("title");
    const slug = slugify(title);
    const id = "input-" + slug;

    return li([
      label({ for: id }, [title]),
      input({
        name: id,
        id,
        type: field.getAttribute("type") || "text",
        value: field.textContent,
        required: true,
        onInput(e) {
          const val = e.currentTarget.value;
          cb(field, val);
        }
      })
    ]);
  };
}

function getFormatter(name) {
  const modifierName = modifiers[name] ? name : "identity";
  return modifiers[modifierName];
}

function container(form) {
  const { img, button, aside } = ui;
  const title = "Sett inn verdier";

  const el = aside({ class: "var-injector" }, [
    button(
      {
        title,
        class: "toggleButton",
        onClick() {
          el.classList.toggle("var-injector--open");
        }
      },
      [
        img({
          src: "../assets/edit.svg",
          alt: title
        })
      ]
    ),
    form
  ]);
  return el;
}

function insertCss() {
  const { link } = ui;
  document.querySelector("head").appendChild(
    link({
      type: "text/css",
      rel: "stylesheet",
      href: "../src/inject-style.css"
    })
  );
}

function createLogo() {
  const { img } = ui;
  return img({
    alt: "Variant",
    class: "logo",
    src: "../assets/logo-bw.svg"
  });
}

function updateUrlBox() {
  const updateBox = document.querySelector("#urlbox");
  const data = getObjectFromFields();
  const url = objectToUrl(data);
  updateBox.value = url;
}

function unique(fields) {
  const visited = [];
  return fields.reduce(function(acc, item) {
    if (visited.includes(item.getAttribute("title"))) return acc;
    visited.push(item.getAttribute("title"));
    return acc.concat(item);
  }, []);
}

function isInContainer(el, container) {
  let check = el;
  do {
    if (check === container) {
      return true;
    }
  } while ((check = check.parentNode));
  return false;
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
