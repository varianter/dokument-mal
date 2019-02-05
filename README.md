# WIP Open Source mal og kontrakt fra Variant

Her finner du et sett med dokumentmaler og kontraktmaler vi bruker i Variant og
som du gjerne kan bruke også! De er helt åpne og lisensiert under MIT lisens.
Det er ingen krav til attributering, men om dere vil komme innom for en kopp
kaffe sier vi gjerne ja!

## Utvikling

Dette er kun relevant dersom du ønsker å utvide dette prosjektet med nye
dokumenter eller avtaler.

### Generere `index.html`

**Du må ha [node](https://nodejs.org/) installert for at dette skal fungere.**

`index.html` er en oversikt over alle avtaler som ligger under
[./avtaler](./avtaler). For å slippe å holde denne oppdatert selv blir det
generert automatisk via [\_tools](./_tools/generate.js):

```sh
# Fra prosjekt root
node _tools/generate.js
```
