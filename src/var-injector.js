var templateRegex = /\[([A-Z]+)?\[([^\|]+)\|([^\]]+)\]([a-zA-Z0-9_]+)?\]/gm;
var ce = document.createElement.bind(document);
var sel = document.querySelector.bind(document);
var sela = document.querySelectorAll.bind(document);

var modifiers = {
  formatDate(i) {
    console.log(i);
    var options = {
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
  var main = sel("main");
  var content = main.innerHTML;
  var fields = getFields(content);
  main.innerHTML = replaceFieldsWithContainers(content, fields);
  var form = constructForm(fields);
  document.body.insertBefore(form, main);
});

////
/// Parsing.
///
function getFields(content) {
  var data;
  var result = [];
  do {
    data = templateRegex.exec(content);
    if (!data) continue;
    result.push(toObject(data));
  } while (data);

  return unique(result);
}

function replaceFieldsWithContainers(content, fields) {
  return content.replace(templateRegex, wrapContainer);
}

////
/// HTMLElement creation.
///
function wrapContainer() {
  var obj = toObject(arguments);
  var container = ce("span");
  container.className = "js-" + obj.slug;
  container.setAttribute("data-modifier", obj.modifier);
  container.textContent = modifiers[obj.modifier](obj.defaultValue);
  return container.outerHTML;
}

function updateValue(field, value) {
  var els = sela(".js-" + field.slug);
  arrify(els).forEach(function(el) {
    var modifier = el.getAttribute("data-modifier");
    el.textContent = modifiers[modifier](value);
  });
}

function constructForm(fields) {
  var form = ce("form");
  var ul = ce("ul");

  fields
    .map(createConstructInputLi(updateValue))
    .forEach(ul.appendChild.bind(ul));

  form.appendChild(ul);

  return form;
}

function createConstructInputLi(cb) {
  return function(field) {
    var label = ce("label");
    label.setAttribute("for", "input-" + field.slug);
    label.textContent = field.field;

    var input = ce("input");
    input.name = field.slug;
    input.id = field.slug;
    input.type = field.type;
    input.value = field.defaultValue;
    input.required = true;

    var li = ce("li");
    li.appendChild(label);
    li.appendChild(input);

    input.addEventListener("input", function(e) {
      var val = e.currentTarget.value;
      cb(field, val);
    });

    return li;
  };
}

////
/// Helper utils.
///
function toObject(data) {
  var modifier = modifiers[data[4]] ? data[4] : "identity";
  return {
    field: data[2].trim(),
    defaultValue: data[3].trim(),
    type: (data[1] || "TEXT").toLocaleLowerCase(),
    slug: slugify(data[2]),
    modifier: modifier
  };
}

function unique(fields) {
  var visited = [];
  return fields.reduce(function(acc, item) {
    if (includes(visited, item.field)) return acc;
    visited.push(item.field);
    return acc.concat(item);
  }, []);
}

function includes(arr, item) {
  // Avoid Array.includes due to support.
  return arr.indexOf(item) !== -1;
}

function arrify(arrayLike) {
  return [].slice.call(arrayLike);
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "-")
    .replace(/[\s\W-]+/g, "-");
}
