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
function getInputs(els = sela("input")) {
  return Array.from(els).filter(i => i.id.indexOf("input-") === 0);
}
function getFieldsOfType(selector) {
  return Array.from(sela(`v-field[title='${selector}']`));
}
function getLoopsOfType(selector) {
  return Array.from(sela(`[data-vlist="loop"][data-title="${selector}"]`));
}
function getObjectFromFields() {
  let obj = {};
  for (let field of getInputs()) {
    obj[field.name] = field.value;
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
function createRowInserter(parent) {
  const tr = parent.querySelector("tr").cloneNode(true);
  return function(values) {
    const cloned = tr.cloneNode(true);
    Array.from(cloned.querySelectorAll(`v-item`)).forEach(function(el) {
      const formatter = getFormatter(el.getAttribute("format"));
      el.textContent = formatter(values[slugify(el.title)]);
    });
    return cloned;
  };
}

function updateList(title, values) {
  getLoopsOfType(title).forEach(function(el) {
    const rowInserter = createRowInserter(el);
    emptyNode(el);
    values.forEach(function(valueSeries) {
      el.appendChild(rowInserter(valueSeries));
    });
  });
}

function constructForm(fields, lists, cb) {
  const { form, ul } = ui;
  const updateInputDecoration = (...args) => {
    cb();
    updateValue(...args);
  };
  const updateListDecoration = (...args) => {
    cb();
    updateList(...args);
  };
  return form([
    ul([
      ...unique(fields).map(createConstructInputLi(updateInputDecoration)),
      ...constructListsInput(lists, updateListDecoration),
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
    const updateList = () =>
      update(listTitle, createValuesFromLoop(loopInputs));

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
              updateList();
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
          id: id,
          name: `input-${listSlug}[${i}][${slug}]`,
          type: field.getAttribute("type") || "text",
          value: field.textContent,
          required: true,
          "data-slug": slug,
          onInput() {
            updateList();
          }
        })
      ]);
    }

    let items = isFirst => {
      const trs = list.querySelectorAll("tr");
      const len = isFirst ? 0 : trs.length;
      return Array.from(trs[0].querySelectorAll("v-item")).map(d =>
        createItem(d, len)
      );
    };
    const rows = ul([inputLi(items(true))]);

    function newRow() {
      rows.appendChild(removable(items()));
      updateList();
    }

    const loopInputs = fieldset(
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
    return loopInputs;
  });
}

function createValuesFromLoop(fieldset) {
  return Array.from(fieldset.querySelectorAll("li")).map(function(row) {
    const inputs = getInputs(row.querySelectorAll("input"));
    const obj = {};
    for (let item of inputs) {
      obj[item.getAttribute("data-slug")] = item.value;
    }
    return obj;
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
    const metadata = getPath(key);
    if (!metadata) {
      obj[key] = val;
    } else {
      if (!obj[metadata.base]) {
        obj[metadata.base] = {};
      }

      if (!obj[metadata.base][metadata.index]) {
        obj[metadata.base][metadata.index] = {};
      }
      obj[metadata.base][metadata.index][metadata.name] = val;
    }
  }

  // normalize from object to array when nested
  for (let key in obj) {
    if (typeof obj[key] !== "object") continue;
    obj[key] = Object.keys(obj[key]).map(k => obj[key][k]);
  }
  return obj;
}

function getPath(key) {
  const res = /([\w\-]+)\[(\d+)\]\[([\w\-]+)\]/gm.exec(key);
  if (!res) return;
  const [, base, numS, name] = res;

  return {
    base,
    index: parseInt(numS, 10),
    name
  };
}

function emptyNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  return node;
}
