const { save, getTemplate, exists, insert } = require("./utils");

const [filename, title] = process.argv.slice(2);

if (!filename || !title) {
  console.error("Filnavn og tittel er påkrevd.");
  console.log(
    'Eksempelbruk: node _tools/create.js my-contract "Kontrakstnavn her"'
  );
  process.exit(1);
}

(async function start() {
  try {
    if (await exists(filename)) {
      throw new Error(
        "Kontrakt med det navnet finnes fra før. Velg et annet navn"
      );
    }
    const template = await getTemplate("contract_template");
    const result = insert(template, { title });
    save(`avtaler/${filename}`, result);
    console.log(`Generated ${filename}.html`);
  } catch (e) {
    console.error("Error:", e);
  }
})();
