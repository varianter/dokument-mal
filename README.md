# Open Source mal og kontrakt fra Variant

Her finner du et sett med dokumentmaler og kontraktmaler vi bruker i Variant og
som du gjerne kan bruke også! De er helt åpne og lisensiert under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)-lisens. _TL;DR:
Kopier oss gjerne og bruk avtalene som dine egne, men please da, prøv å være med
på å være åpne dere også!_. Koden er lisensiert som MIT.

## Dine egne versjoner av avtalene

Vi oppfordrer alle til å bruke disse avtalene. For å lage dine egne versjoner av
avtalene kan du kopiere denne kodebasen ved å trykke "fork" oppe i høyre hjørne.
Ved å aktivere [Github Pages](https://pages.github.com/) på det prosjektet vil
du få opp din egen kopi av avtalene som du kan endre. For å endre innholdet av
avtaler er det bare til å oppdatere selve filene som finnes under
[`./avtaler`](./avtaler). Når man oppdaterer kodebasen vil avtalene automatisk
bli oppdatert.

Om du legger til nye avtaler må fremsiden genereres på nytt. Se
[Utvikling](#utvikling) for detaljer.

### Din egen profil

For å tilpasse til din egen profil burde avtaler endres til å si ditt firmanavn
og dine detaljer. I tillegg burde følgende filer endres til deres logo:

- [assets/logo.svg](./assets/logo.svg)
- [assets/logo-bw.svg](./assets/logo-bw.svg)
- [assets/favicon.svg](./assets/favicon.svg)

Og maler kan oppdateres:

- [\_tools/contract_template.html](./_tools/contract_template.html)
- [\_tools/index_template.html](./_tools/index_template.html)

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

### Opprett ny avtale
Lag en ny html fil under mappen avtaler/{land}/{type}. Kopier gjerne fra en annen avtale. 
Du kan også lage nye avtaletyper. Da må du lage en ny mappe under avtaler/{land}. Husk meta.json fil for å spesifisere rekkefølgen og navnet på typen. 
For at den nye avtalen og eventuelt typen skal vises, så må du generere index.html på nytt, se forrige avsnitt. 


### Kjøring av prosjeket lokalt
De relative stiene virker ikke hvis den ikke kjører på en webserver. Gå til mappen for prosjektet og skriv:

```sh
npm install -g http-server
http-server
```
nettsiden kjøer da på http://localhost:8080/