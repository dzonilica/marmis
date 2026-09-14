# MARMIS — lokalna kopija sajta (početna + kontakt)

Statički mirror sajta https://www.verostudio.com/, skinut 2026-09-08,
skraćen 2026-09-09 na dve stranice i prebrendiran u **MARMIS — šivačku radnju**
(tekst, meni, logotip, ikonice) 2026-09-09. Druga strana je 2026-09-11 postala
**Kontakt** (`/kontakt`), a na početnoj je nova galerija „Otvaranje" i nova
3D haljina sa krojačkom lutkom.

## Pokretanje

```bash
node _local-server.js 8099      # pa otvori http://localhost:8099/
```

Port se može promeniti (`node _local-server.js 3000`).

**Zašto server, a ne dupli klik na `index.html`?** Stranice traže apsolutne
putanje od korena (`/_next/...`, `/fonts/...`), koje `file://` ne razrešava.

## Šta je unutra

| | |
|---|---|
| 2 stranice | `/` (početna) i `/kontakt` (Kontakt) |
| `registry/` | samo preusmerenje sa stare adrese `/registry` na `/kontakt/` |
| `_next/` | JS chunkovi i CSS iz Next.js builda |
| `webgl/` | 3D haljina sa lutkom (`haljina-lutka`, vidi „3D haljina"), draco dekoder, MSDF atlas logotipa |
| `media/` | **sve fotografije i video sa početne** + `sanity-map.json` (vidi „Fotografije") |
| `marmis/` | `galerije.css` + `galerije.js` — galerija „Otvaranje" (vidi „Galerija"); `media-mobile.js` — sprečava skidanje nepotrebnog hero videa, `koraci-mobile.js` — otkrivanje koraka na telefonu (oba: vidi „Telefon"); `_alati/` — generatori galerije i 3D haljine |
| `realslike/` | prave fotografije naručioca (2026-09-13) — izvori za korake, diptih i deo galerije, vidi „Fotografije" |
| `haljina_sa_lutkom/` | izvorni 3D model naručioca (GLB/OBJ/BLEND + teksture, ~90 MB) — ne ide na server |
| `images/registry/` | `dress.png` — jedina slika na stranici Kontakt (putanja je interna, ostaje) |
| `fonts/` | EB Garamond + Inter (OFL) — vidi „Fontovi" |
| `_fontovi/` | alati kojima su fontovi, 3D natpis i `brand.svg` napravljeni, i `izbor.html` (zapis odluke) |
| ostalo | favikoni, `brand.svg`, `icons.svg`, `ingest/` (PostHog), `robots.txt`, `sitemap.xml`, `site.webmanifest` |
| `_backup-original/` | originalni (VERO) fajlovi pre prebrendiranja + `index-pre-media.html` |
| `_backup-2026-09-11/` | stanje pre izmena od 2026-09-11 (Usluge, stara galerija, znak u zaglavlju) |
| `_backup-2026-09-11-tri-galerije/` | stanje sa sve tri verzije galerije i sekcijom „Vaša odeća zaslužuje pravu meru", pre izbora |
| `_backup-2026-09-11-stara-haljina/` | stara 3D haljina (`webgl/dress-felicity/`) i originalni `0llrukolnvf9j.js`, pre zamene |
| `_backup-media-2026-09-13/` | `media/`, `index.html` i `_media-build.js` pre zamene fotografija pravim (2026-09-13) |
| `_backup-kontakt-2026-09-13/` | obe stranice i `0hk_b7xgkd4m6.js` pre svođenja kontakta na telefon (2026-09-13) |
| `_backup-fontovi-2026-09-13/` | probni fontovi, stari `brand.svg`, stari MSDF atlas i dva chunka pre zamene fontova |
| `_deploy-build.js` | pravi `_deploy/` — sve što ide na server (vidi „Objavljivanje na marmis.rs") |
| `_deploy-preview.js` | servira `_deploy/` tačno kao Vercel, za proveru pre slanja |
| `_deploy/` | rezultat builda; ne uređuje se ručno, pravi se iznova |

Izvorne slike stoje u `realslike/` (prave fotografije, 2026-09-13) i u korenu
(`logo.png`, `herovideo.mp4`, `galerija1.jpg`, `slika2–16.jpg`).
Sve u `media/` je iz njih izvedeno skriptom `node _media-build.js` (isečeno
na traženi odnos stranica i skalirano), pa se može regenerisati.
`ChatGPT Image *.png` i `slika5,6,8,9,13.jpg` se od 2026-09-13 **više ne
koriste** (vidi „Fotografije → Zamena pravim fotografijama").

## Šta je promenjeno u odnosu na original

- **Meni**: izbačene su sve stavke čije stranice ne postoje u kopiji
  (`/about`, `/process`, `/gallery`, `/product`, `/legals/*`,
  `/featured-designers`, `/accessibility`, Instagram, LinkedIn).
  Ostalo je **Početna** i **Kontakt**. Nijedan link više ne vodi u 404.
- **Sav tekst** je prepisan na srpski, za šivačku radnju MARMIS —
  i u SSR HTML-u i u RSC (`self.__next_f`) payload-u, da hidracija ostane ispravna.
- **Druga strana je Kontakt** (vidi „Stranica Kontakt"). Na sajtu više nigde ne
  piše „usluge"; sva dugmad vode na `/kontakt`.
- **Logotip**: `brand.svg` i 3D WebGL logo (`webgl/logo/`) pišu MARMIS,
  iscrtano iz fonta koji sajt koristi — od 2026-09-13 iz EB Garamonda
  (ranije iz Louize Displaya, vidi „Fontovi").
- **Znak (logo)**: `logo.png` (šivaća mašina, silueta) je favikon,
  apple-touch i android ikonica. U zaglavlju ga više nema — tamo stoji natpis
  MARMIS iz heroa (vidi „Natpis u zaglavlju").
- **Fotografije i video**: sve je zamenjeno naručiočevim materijalom
  (vidi „Fotografije").
- **Uklonjena sekcija** sa citatom „Dobar kroj se ne primeti odmah…"
  (LargeQuote) — i iz HTML-a i iz RSC-a.
- **Uklonjena sekcija** „Vaša odeća zaslužuje pravu meru" / „Zakažite termin"
  (Reassurance, poslednja pred futerom) — SSR blok i red `21` u RSC-u. Galerija
  je sada poslednja sekcija; razmak do futera daje `padding-bottom` na `.mg`.
- **Kontakt je od 2026-09-13 samo telefon** `063 609158` (`tel:+38163609158`) —
  vidi „Kontakt podaci". Domen `marmis.rs` stoji u canonical-u, `og:url`-u i
  JSON-LD `@id`-ju na obe stranice; od 2026-09-13 sajt je i spreman za njega —
  vidi „Objavljivanje na marmis.rs". Sam domen još nije povezan.

## Ključno pravilo: putanje u HTML-u se NE diraju

Prepisivanje **putanja** unutar RSC payload-a ruši React hidraciju — stranica
padne na prazan skelet, uvodni loader ostane zaglavljen preko svega, meni se ne
otvara, 3D se ne montira. Ako nešto treba da se mapira na drugu putanju, to se
radi u `_local-server.js`, nikad u HTML-u.

(Jedini izuzetak su URL-ovi slika, i to pod strogim uslovima — vidi
„Fotografije → Kako slike stižu do browsera".)

(Tekst se sme menjati, ali **uvek na oba mesta istovremeno** — i u vidljivom
HTML-u i u `self.__next_f.push(...)` payload-u — inače React posle hidracije
vrati stari tekst.)

(Izuzetak od 2026-09-11: `href` linkova ka drugoj strani je `/kontakt` umesto
`/registry` — promenjen istovremeno u SSR-u, u RSC-u i u tri JS chunka
(`0rr86m823plm1.js` meni, `0hk_b7xgkd4m6.js` futer, `0zjg_4s8nezvs.js`
Sanity linkovi). Interni segment rute u RSC-u (`"c":["","registry"]` i stablo u
redu `0` na stranici Kontakt) je namerno ostao `registry`; Next na klijentu
uzima URL iz `window.location`, pa to ne smeta.)

Dve posledice tog pravila, obe rešene u serveru:

- Stranice preload-uju fontove relativnom putanjom (`fonts/X.woff2`). Na živom
  sajtu URL je `/kontakt` bez kose crte, pa se to razreši na `/fonts/X.woff2`;
  ovde se sve servira sa `/kontakt/`, pa server mapira `*/fonts/*` nazad na
  koren.
- Slike i skriptovi sa query parametrima (`dress.png?w=3840&q=90`,
  `surveys.js?v=1.386.8`) snimljeni su pod običnim imenom — server ignoriše
  query.

## Fotografije

Sve fotografije i video na obe stranice su naručiočevi. Ništa se više ne vuče
sa `cdn.sanity.io`.

| gde | fajlovi u `media/` |
|---|---|
| hero video (desktop / mobilni) | `hero.mp4`, `hero-mobile.mp4`, poster `hero-poster.jpg` |
| sekcija sa 3 koraka koja „zaustavlja" skrol | `korak-1..3.jpg` (+ `-m` mobilni isečci) |
| „Kupljeno u radnji. Nikad baš po vama." | `dip-1..6.jpg` (+ `dip-4-m.jpg`) |
| galerija | `gal-01..11.jpg` — obične slike, ne idu kroz Sanity builder |
| og:image / twitter:image | `og.jpg` |
| stranica Kontakt | `images/registry/dress.png` |

**Na početnoj se svaka izvorna slika koristi tačno jednom** — raspored je u
`_media-build.js` (`SRC`, `MAP`, `GALLERY`): koraci `V1..V3` (desktop) i
`W1..W3` (mobilni); diptih `X1, G, E, H, Y1, X2`; galerija
`X3, F, Y2, X4, X5, P, Q, X6, X7, T, Y3`.

### Zamena pravim fotografijama (2026-09-13)

Naručilac je dostavio fasciklu `realslike/` sa pravim fotografijama i obrisao
iz `media/` sve što je bilo izvedeno iz AI slika, a zatim (u drugom prolazu)
i tri slike iz radionice. Zamenjeno je ukupno 17 fajlova:

| slot | izvor iz `realslike/` |
|---|---|
| `korak-1.jpg` / `korak-1-m.jpg` | `16kroz9.png` / `800246312_...jpg` (žuta haljina, stepenište) |
| `korak-2.jpg` / `korak-2-m.jpg` | `16kroz92.png` / `805783466_...jpg` (brokat, terasa) |
| `korak-3.jpg` / `korak-3-m.jpg` | `16KROZ93.png` / `802455369_...jpg` (brokat, zid sa vazom) |
| `og.jpg` | `16KROZ93.png` |
| `dip-1.jpg`, `dip-6.jpg` | `804443033_...jpg`, `807698684_...jpg` |
| `gal-01, 04, 05, 08, 09` | `802108638`, `801243479`, `803539693`, `806197600`, `805876240` |
| `dip-5.jpg` | `801937090_...jpg` (brokat uz zgradu od cigle) |
| `gal-03.jpg` | `800468491_...jpg` (brokat, sedi na klupi) |
| `gal-11.jpg` | `801008300_...jpg` (crno-belo, tamni hodnik) |

Desktop i mobilna verzija svakog koraka su sa **istog snimanja** (`V1`↔`W1` itd.),
pa prelaz između širina ne menja motiv.

Time su iskorišćene sve fotografije iz `realslike/` osim tri; iz korena se više
ne koriste ni `slika7`, `slika10` i `slika16`.

Uz slike su promenjeni i vidljivi potpisi i `alt` tekstovi koji više nisu tačni
(u galeriji: „Svečana haljina od satena" → „Crvena svečana haljina",
„Haljine pred probu" → „Brokatna haljina", „Komadi na lutkama" →
„Haljina u ogledalu", „Satenska balon haljina" → „Svečana haljina u gradu",
„Korset u izradi" → „Crna svečana haljina"; u koracima `alt`
„Uzimanje mere / Krojenje / Gotov komad" → opis onoga što se zaista vidi).
Sve **i u SSR HTML-u i u RSC payload-u**. Uz `gal-11` su promenjeni i
`width`/`height` (736×1308 → 1000×1334), jer se slika sada iseca na 3/4.

Svaka izvedena slika za korake i diptih je isečena **na tačno onaj odnos
stranica koji je imala slika koju menja**, jer `width`/`height` atributi u
HTML-u i u RSC payload-u ostaju netaknuti — tako layout stranice ostaje
identičan i hidracija prolazi. Galerijske slike (`gal-*`) zadržavaju odnos koji
za njih pišu `width`/`height` u HTML-u (zamenjene se isečaju na njega, vidi peti
i šesti član u `GALLERY`); raspored ih dodatno seče preko `object-fit: cover`
na `aspect-ratio: 3/4`.

**Izuzetak (izmereno 2026-09-13): `dip-2` i `dip-5`.** One su u
`DiptychDoubleMaskMedia`, koji slici zada i `width` i `height` u CSS-u, pa
`aspect-ratio: auto 800/670` ostaje samo rezerva — okvir je **portret ~0.72**,
bez obzira na atribute. Isecanje na atributima zapisan pejzažni odnos zato
nema svrhe: `object-fit: cover` posle odbaci ~40% širine. Zato `dip-5` ima
ručni odnos (`0.72`, šesti član njegovog reda u `MAP`-u). `dip-2` je i dalje
pejzaž i time gubi deo slike; ako se jednom bude menjao, i njemu treba `0.72`.

Pravilo: pre zamene slike izmeri okvir u browseru
(`getBoundingClientRect()` na `<img>`) umesto da veruješ atributima.

3D haljina u sekciji „Svaki šav tačno na svom mestu" je od 2026-09-11
naručiočev model — vidi „3D haljina".

### Kako slike stižu do browsera

Ovo nije obična zamena `src` atributa. Komponente na klijentu **ponovo grade**
URL slike kroz `@sanity/image-url`, iz ref-a koji parsiraju iz `src` stringa u
payload-u. Zato je urađeno ovako:

1. U `index.html` je sa svih URL-ova slika skinut samo host
   (`https://cdn.sanity.io/images/...` → `/images/...`). **Ime fajla
   (`<hash>-ŠIRINAxVISINA.ext`) je ostalo netaknuto**, jer se iz njega parsira
   ref; ako se ono promeni, `@sanity/image-url` baci grešku i cela stranica
   padne na „Something went wrong".
2. `_next/static/chunks/0zjg_4s8nezvs.js` (to je `@sanity/image-url`) ima dve
   sitne zakrpe — original je u `_backup-original/`:
   - `baseUrl` je forsiran na prazan string, da builder gradi URL na istom
     origin-u umesto na `cdn.sanity.io`;
   - `parseSource` prihvata i apsolutnu putanju (`/images/...`), ne samo
     `http(s)://` URL.
3. `_local-server.js` prevodi `/images/xei5vqg0/production/<ime>` u fajl iz
   `media/`, po tabeli `media/sanity-map.json`.

Video ne prolazi kroz taj builder, pa `<video src>` pokazuje direktno na
`/media/hero*.mp4`.

**Ako se sajt ikad bude servirao bez `_local-server.js`** (čist statički
hosting), tačka 3 otpada — tada fajlove iz `media/` treba iskopirati u
`images/xei5vqg0/production/` pod imenima iz `sanity-map.json`.

## Telefon

Raspored je responzivan iz originala (prelomi na 480 i 930 px, mobilni isečci
slika, mobilni hero video) i na 390 px nema vodoravnog prelivanja. Ispod je
popravka sekcije sa koracima (2026-09-13) i četvoro od 2026-09-12, kad je
stranica na telefonu vukla **12,2 MB**:

- **`marmis/koraci-mobile.js`** (2026-09-13) — u sekciji sa tri koraka
  („stop scroll", `FullSizeScrollerStepper`) na telefonu se videla **samo prva
  slika**. Sva tri kadra stoje jedan preko drugog (`position: sticky`) i otkriva
  ih `clip-path: polygon(calc((1 - var(--mask-progress)) * 100%) …)`; prvi ima
  `clip-path: none` pa se vidi uvek, druga dva zavise isključivo od te
  promenljive. Dve stvari to obaraju baš na telefonu: `100lvh` (visina kadra)
  nije isto što i `window.innerHeight` dok se adresna traka pojavljuje i
  nestaje, pa se keširane mere u React-u raziđu sa rasporedom; i WebKit ne
  precrtava element kad se promeni **neregistrovana** CSS promenljiva unutar
  `calc()` u `clip-path`-u. U oba slučaja ostane clip za progres 0, tj. kadar
  ostane skroz odsečen. Skripta ispod 930 px računa progres sama, iz živih mera
  (`getBoundingClientRect`, bez keširanja i bez `innerHeight`), i upisuje
  **običan inline `clip-path`** — obično svojstvo svaki engine precrta.
  Kriva je ista kao originalna (izmereno: isti brojevi do dve decimale), iznad
  930 px se inline vrednost sklanja i sve vodi originalni CSS.
  **Dopuna 2026-09-14** — do tada popravka nije radila ni na jednom telefonu,
  iako se skripta uredno učitavala. Skripta ide sa `defer`, dakle **pre React
  hidracije**, a React pri hidraciji zameni te DOM čvorove novima; skripta je
  ostajala sa referencama na stare, odvojene čvorove i savesno im upisivala
  `clip-path` koji niko ne vidi. Sada se na svakom kadru proverava
  `isConnected` i lista kadrova se skuplja iznova čim se čvorovi zamene (uz
  ponovno skupljanje na `load` i 1,2 s / 4 s posle). Uz to, dok je sekcija na
  ekranu računa se u neprekidnoj `requestAnimationFrame` petlji umesto samo na
  `scroll` — iOS priguši skrol događaje dok traje inercija, pa bi se kadrovi
  zaustavljali u pola otkrivanja. Provereno u pregledaču na 390 × 844: druga i
  treća slika idu 0 → 100 %, na 1440 × 900 inline vrednosti nema.
- **`marmis/media-mobile.js`** — komponenta `Media` iscrtava **oba** hero videa
  u DOM i CSS-om sakrije onaj koji ne treba, ali ga browser svejedno skine: na
  telefonu celih 2,5 MB `hero.mp4` preko 0,8 MB `hero-mobile.mp4`. Skripta pre
  hidracije skida `src` sa nepotrebnog `<video>`-a (čuva ga u
  `data-mg-parked`), skida `autoplay` i stavlja `preload="none"`; na promenu
  širine prozora vraća ga i pusti. Putanje se ne prepisuju — samo privremeno
  sklanjaju i vraćaju nepromenjene. Mora da se učita u `<head>` **bez**
  `defer`/`async`, da `MutationObserver` uhvati `<video>` čim ga parser napravi.
  Ukupno: **12,2 MB → 7,4 MB**.
- **`_local-server.js` sada podržava Range zahteve** (206 / 416, `accept-ranges`).
  Bez toga iOS Safari uopšte ne pušta `<video>`, a svaki seek je ponovo vukao
  ceo fajl (video se merio dvostruko).
- **WebGL platno ispod 930 px crta na `dpr` 1.5** umesto 2
  (`0rr86m823plm1.js`) — 44 % manje piksela po kadru, manje grejanja.
- **Mapa senke ispod 930 px je 1024² umesto 2048²** (`0llrukolnvf9j.js`).
  Ova scena `shadow.render()` **nikad ne poziva**, pa je 16 MB GPU memorije
  stajalo neiskorišćeno; slika je posle izmene piksel u piksel ista.

Ostatak težine na telefonu je 3D haljina (`.glb` 2,5 MB + mape 0,8 MB + draco
dekoder 0,5 MB). Učitava se tek kad sekcija priđe na jedan ekran
(`rootMargin: 100%`), a petlja crtanja stoji dok je sekcija van ekrana.

## Natpis u zaglavlju

Na početnoj je slot za logo u zaglavlju namerno prazan: natpis MARMIS iz heroa
(WebGL beli + SVG tamni, `MainHero__brand`) pri skrolu klizi i smanjuje se
tačno u taj slot, kao u originalu. Ponašanje je originalno: kad se skroluje
100+ px nadole i prođe se hero (+200 px), natpis nestane (pre sekcije sa
haljinom); na bilo koji skrol nagore odmah se vrati. To radi JS sajta
(`MainHero` + zaglavlje), ništa nije zakrpljeno. (Do 2026-09-11 je u
`_next/static/chunks/18bp.akqca-3_.css` stajalo `opacity:1!important` koje ga je
držalo stalno vidljivim — uklonjeno na zahtev. Ranije je u slotu bio znak sa
šivaćom mašinom preko CSS maske — uklonjen je; stari fajl je u `_backup-2026-09-11/`.)

## Stranica Kontakt

`kontakt/index.html` je nekadašnja `registry/index.html` (Usluge) sa novim
sadržajem: naslov, telefon kao `tel:` link i dugme „Pozovite i zakažite termin"
(vidi „Kontakt podaci"). Menjano je u SSR-u i u RSC-u
(red `5` sadržaj, red `d` title/description/canonical, red `12` prevodi).
`registry/index.html` je sada samo preusmerenje na `/kontakt/` (za statički
hosting), a `_local-server.js` stari URL vraća sa 301.

## Kontakt podaci

Od 2026-09-13 je na celom sajtu **samo telefon** — `063 609158`, kao
`tel:+38163609158`. Nema e-maila, nema adrese i radnog vremena, nema nijedne
forme. Izbačeno je (svuda i u SSR HTML-u i u RSC payload-u):

| gde | šta |
|---|---|
| JSON-LD `ClothingStore`, obe strane | `email` → `telephone`, ceo `address` blok uklonjen |
| zaglavlje (panel menija), obe strane | `Kontakt:` + telefon; e-mail red uklonjen |
| dugme `product` u zaglavlju | `mailto:` → `tel:`, natpis „POŠALJITE nam PORUKU odmah" → „POZOVITE nas ODMAH" |
| stranica Kontakt | stavke „E-mail" i „Adresa i radno vreme" uklonjene iz liste (SSR `<li>` i redovi `1`/`2` u RSC stablu), ostala samo „Telefon" |
| prevodi (`registry.platforms`) | ostao samo `the_knot` (Telefon); `zola` i `over_the_moon` uklonjeni |
| `meta description`, uvodni tekstovi | više ne pominju e-mail, adresu ni radno vreme |
| futer — forma za prijavu na e-mail | uklonjena |

Forma u futeru (`RootLayoutFooterEmailCapture`) se ne iscrtava iz RSC-a nego iz
JS-a, pa nije bilo dovoljno obrisati SSR blok — u
`_next/static/chunks/0hk_b7xgkd4m6.js` je uslov `"default"===d&&` (uz
`className: en.default.emailCapture`) promenjen u `!1&&`. Oba mesta su promenjena
zajedno, da hidracija prođe čisto. Prevodi `footer.email_capture` su ostali u
payload-u, ali ih više niko ne čita.

Stanje pre ove izmene je u `_backup-kontakt-2026-09-13/`.

## Galerija „Otvaranje"

Na početnoj, posle naslova „vaš kroj je samo vaš i ničiji drugi.", stoji
galerija **Otvaranje**: scena se zakuca, jedna slika preko celog ekrana se na
skrol povlači u mozaik, a ostale slike uleću spolja (dalje brže). Koristi 11
slika i dugme „Kontaktirajte nas" (komponenta sajta). Poslednja je sekcija pred
futerom.

(Od tri ponuđene verzije — Trake, Otvaranje, Kolaž — naručilac je 2026-09-11
izabrao Otvaranje; druge dve su obrisane, a stanje sa sve tri je u
`_backup-2026-09-11-tri-galerije/`.)

Gde živi:

- SSR: `<div data-type="galerija-otvaranje">` u `index.html`, posle drugog
  `secondary-hero` bloka;
- RSC: red `35` (obični elementi omotani `SectionContainer`-om, `$L18`),
  referenciran iz liste blokova u redu `5`;
- izgled i pokret: `marmis/galerije.css` i `marmis/galerije.js` (učitani u
  `<head>` početne). JS samo menja `transform`/`opacity` i stavlja atribut
  `data-mg-live` na samu sekciju (`.mg-o`); uz `prefers-reduced-motion` ostaje
  statičan mozaik.

**Znak „živa galerija" ne sme na `<html>` (popravljeno 2026-09-13).** Do tada je
`galerije.js` u `start()` dodavao klasu `mg-live` na `<html>`. Taj čvor iscrtava
React (`RootLayout`), pa ga pri hidraciji uskladi sa svojim stablom i **klasa
nestane** — u konzoli se vidi kao minifikovana React greška `#418`
(*the server rendered HTML didn't match the client*). Posledica je bila tiha i
zbunjujuća: glavna slika izgubi `position:absolute` i `height:min(80svh,130vw)`
pa ostane sitna u svojoj ćeliji, dok skripta i dalje uredno drži ostalih deset
slika, naslov i dugme na `opacity: 0` — na ekranu jedna sićušna slika usred
praznog ekrana, bez ijedne greške u samoj galeriji. Koliko se često dešavalo
zavisilo je od toga da li `start()` stigne pre ili posle hidracije, pa je
izgledalo nasumično.

Sada znak stoji na samoj sekciji, kao **atribut** (`data-mg-live`), koji React
ne prepisuje jer ga nema u svom stablu; selektori su
`.mg-o[data-mg-live] .mg-o__hero`. Postavlja se na tri mesta, da se popravi sam:
kad se galerija prvi put nađe (`Otvaranje`), u `measure()` i u svakom kadru
(provera atributa je zanemarljiva). Ako React ikad precrta ceo čvor, `scan()`
napravi novu instancu i atribut se vrati.

Pravilo koje iz toga sledi: **nijedna skripta iz `marmis/` ne sme da menja
klasu ni stil na `<html>` i `<body>`** — oba pripadaju React-u. Stanje se drži
na elementima koje React ne gleda, ili kao atribut.

Markup se generiše iz `marmis/_alati/galleries.js` (raspored, slike, potpisi) —
isto stablo se pretvara i u SSR HTML i u RSC, pa se ne mogu razići. Posle
izmene: `node marmis/_alati/update-galleries.js index.html`.

**Na telefonu (2026-09-13)** su sličice bile sitne — 67–86 px široke na ekranu
od 390 px. Sada su 100–104 px: mozaik je širi (`width: calc(100% - 24px)` umesto
`- 40px`), viši (`height: 84svh` umesto `74svh`), sa manjim razmakom
(`gap: 10px`) i raspon `--s` (0.78–1) se skuplja naviše
(`calc((.82 + var(--s,1)*.18) * 100%)`), pa razlike među slikama ostaju, ali
blaže. Provereno na 390×844 i 360×740 — bez vodoravnog prelivanja.

## 3D haljina

U sekciji „Svaki šav tačno na svom mestu" (komponenta `DressDiscover`) je od
2026-09-11 naručiočeva haljina sa krojačkom lutkom i srebrnom šipkom
(`haljina_sa_lutkom/`). Koncept je isti kao ranije: model se na skrol okrene
za 360°, kamera ide od vrata do poruba, a donji deo suknje se rastapa u
pozadinu. Materijal, svetlo, kamera i animacija nisu dirani — haljina, lutka i
šipka su iste svetlosive boje kao stara haljina.

Web verzija (`webgl/haljina-lutka/`: `.glb` 2,6 MB + dve JPG mape 0,8 MB;
stara je imala 3,6 MB) pravi se iz izvornog GLB-a:

```bash
"E:\blender\blender.exe" -b --factory-startup --python marmis/_alati/haljina-za-web.py
```

(Blender 5.2, radi i bez prozora.) Skripta:

- briše skriveni nosač u torzu, a haljinu, lutku i šipku spaja u jedan mesh —
  scena sajta uzima tačno jedan (`scene[0].children[0]`) i crta ga jednim
  materijalom;
- haljinu smanjuje sa 311k na 86k trouglova, lutku sa 25k na 10k (ukupno ~97k
  trouglova, ~62k temena — ispod granice za 16-bitne indekse). Donji deo
  suknje, koji se na sajtu rastapa, prvo sam ide na 18k, pa gornji deo
  (steznik, pojas, mašna) zadrži više detalja;
- pravi nov UV raspored bez preklapanja (spoljni i unutrašnji sloj tkanine su u
  originalu delili UV) i peče `-normal.jpg` (šavovi iz originalne normal mape) i
  `-occlusion.jpg` (AO), obe 2048 px;
- AO haljine peče bez lutke kao zaklona: vrh mašne i delovi steznika malo ulaze
  u lutku, pa bi inače na sajtu ispali kao crne tačke;
- postavlja model tako da je osa šipke osa okretanja, a y=0 najniži porub.

Izmene u `_next/static/chunks/0llrukolnvf9j.js` (scena `DressDiscoverScene`):

- tri putanje `/webgl/dress-felicity/dress-felicity*` →
  `/webgl/haljina-lutka/haljina-lutka*` (`.glb`, `-normal.jpg`, `-occlusion.jpg`);
- skaliranje `divide(a.scale.y)` → `divide(a.max.y)`: model se skalira po
  visini od poruba do vrha vrata, pa je haljina iste veličine kao stara, a
  šipka ispod poruba je ne smanjuje. Za stari model je to isto (njegov y
  počinje od 0).

**Početni ugao** (2026-09-12, `052uyh96p_mzs.js`, i isto u neučitanom blizancu
`0s5vc7gzwd48m.js`): okretanje na skrol je bilo `y: [0, -2π]`, a sada je
`y: [1.0472, 1.0472 - 2π]` — model kreće okrenut za **+60°**. Razlog: dok je
haljina lepo kadrirana (od trenutka kad se sekcija zakuca pa nadole) vremenska
linija je već bila na −38° do −260°, pa se prednja strana praktično nikad nije
videla — mašna i prednjica steznika su prolazile bočno i s leđa. Sa +60°
prednja strana pada tačno na deo skrola gde je kamera na stezniku. Ugao se menja
samo tom jednom vrednošću (u radijanima, na oba mesta u nizu); 0 = prednja
strana modela, kao na `haljina_sa_lutkom/pregled.png`.

Šipka se na sajtu praktično ne vidi, jer rastapanje (`fade` u `DressDiscover`,
od 60 % do 25 % visine modela) pokrije sve ispod poruba. Ako treba da se vidi,
to se podešava u `fade` animaciji komponente `DressDiscover`, ne u modelu.

## Internet

- **`/kontakt`** i **`/`** — obe rade potpuno offline.

Sanity „live events" poziv (`xei5vqg0.api.sanity.io/.../live/events`) uvek pada
na CORS jer se ne servira sa verostudio.com domena. To je CMS live-preview
kanal; ne utiče ni na šta. **U `_deploy/` je ugašen** (vidi „Objavljivanje").

## Fontovi

Do 2026-09-13 sajt je koristio **Louize Display** (Blaze Type) i **Beausite
Classic Web Trial** (Fatype). Beausite je bio probna licenca, Louize komercijalan
— nijedan nije smeo na javni domen. Zamenjeni su besplatnim fontovima pod OFL
licencom, koja dozvoljava i komercijalnu upotrebu i serviranje sa svog servera:

| bilo | sada | nosi |
|---|---|---|
| Louize Display (uspravni + kurziv) | **EB Garamond** | naslove, telo i dugmad — 151 element, 15–120 px |
| Beausite Classic (400 + 500) | **Inter** | uvodni pasus i sitan tekst — 51 element, 14–30 px |

Izbor nije napravljen „na oko". Za svakog kandidata je mereno koliko je širi ili
uži od originala (naslovi se prelamaju po širini, pa font koji je 25 % širi
razbije prelome) i kakav mu je odnos malih i velikih slova:

| font | širina reda | mala/velika |
|---|---|---|
| Louize Display (original) | 1.00 | 0.62 |
| **EB Garamond** | 1.045 | **0.62** |
| Cormorant Garamond | 1.086 | 0.62 |
| Instrument Serif | 0.946 | 0.70 |
| Playfair Display | 1.24 | 0.72 |
| Newsreader | 1.24 | 0.72 |
| Zodiak | 1.37 | — |

Odnos 0.62 je otkrio ono što se iz imena ne vidi: **Louize je iz garamondske
porodice**, pa oba Garamonda „leže" na istom mestu bez podešavanja veličine.
Kurziv je bio uslov, jer se u svakom naslovu meša sa uspravnim
(*gde vaša ideja dobija oblik po meri*) — nakrivljeni uspravni ne prolazi.
Poređenje svih kandidata stoji u `_fontovi/izbor.html`.

Srpska slova (č ć ž š đ) su proveravana merenjem glifova, ne na reč.

### Kako se prave

```bash
python _fontovi/napravi-fontove.py      # woff2 za sajt + TTF za MSDF
node   _fontovi/napravi-logo.js         # MSDF atlas + raspored slova
python _fontovi/napravi-brand-svg.py    # vektorski natpis
node   _fontovi/zameni-u-sajtu.js       # ugradi sve u sajt (jednom)
```

`napravi-logo.js` traži `msdf-bmfont-xml` (`npm --prefix _fontovi install
msdf-bmfont-xml`) — istim alatom je napravljen i originalni atlas.

Fontovi se iz izvornog promenljivog TTF-a fiksiraju na jednu debljinu, seku na
slova koja sajt koristi i pakuju u woff2. Ukupno **86 kB**, lakše od originalnih
110 kB. Zadržavaju se samo funkcije koje utiču na iscrtavanje (`kern`, `liga`,
`calt`, `ccmp`, `locl`, `mark`, `mkmk`, `rlig`, `clig`); sa `'*'` subsetter
povuče i stilske setove i kapitalke, pa je EB Garamond bio 161 kB umesto 58.

**Zamka:** `subset.Options().flavor` važi samo kad se `fonttools` pokreće kao
alat iz komandne linije. Kroz biblioteku se `font.flavor` mora postaviti ručno,
inače izađe nekompresovan TTF pod imenom `.woff2` — duplo veći, a CSS tvrdi da je
woff2. (Tu grešku su prvo imali svi fajlovi.)

### Natpis MARMIS je bio iscrtan iz Louizea

Ovo je lako prevideti: i `brand.svg` i 3D natpis u herou su **konture izvedene iz
Louize Displaya**, pa su nosili isti licencni problem kao i sam font — iako su
jedan SVG i jedna slika, ne font. Oba su ponovo napravljena iz EB Garamonda.

- **`brand.svg`** — `<symbol id="logo" viewBox="0 0 100 31">` sa šest putanja u
  `currentColor`. Zadržani su i viewBox i `currentColor` (na njih se oslanjaju
  HTML i `0rr86m823plm1.js`). Natpis se, kao i pre, razvlači na punu širinu i
  centrira po visini. Koordinate se skraćuju na tri decimale — pun zapis
  udvostručuje fajl bez razlike na ekranu (29,6 → 11,1 kB).
- **`webgl/logo/font.json` + `font.png`** — MSDF atlas, pet glifova (M A R I S),
  veličina 150, `distanceRange` 25.

Scena (`11sswtocfulc~.js`) iz atlasa uzima **samo UV isečak**; položaj i veličina
svakog slova stoje **zakucani u nizu u samom chunku**, u stotinkama jedinice:

```js
[{id:0,char:"M",x:0,y:3.64,width:92.45,height:72.79}, …]
```

Zato je uz atlas moralo da se promeni i to — EB Garamond ima druge širine slova
od Louizea. Niz računa `napravi-logo.js` i upisuje ga `zameni-u-sajtu.js`.

Scena sama uklapa natpis u širinu ekrana (`resize()` uzima manji od dva odnosa),
pa **ukupna veličina nije bitna — bitan je samo odnos stranica**. Novi natpis je
pri istoj širini oko 14 % niži, jer EB Garamond ima šira slova u odnosu na visinu
velikih slova.

Prirodni razmak EB Garamonda je za ovoliki natpis pretesan (slova se skoro
dodiruju), pa oba alata dodaju `RAZMAK = 35` jedinica fonta. **Ta vrednost mora
da bude ista u `napravi-logo.js` i u `napravi-brand-svg.py`** — isti natpis se
crta na dva mesta (3D u herou, SVG u zaglavlju) i ne sme da se raziđe.

### Gde su imena fontova

Samo u **jednom** CSS chunku (`0ot2j1ufaj_~p.css`): četiri `@font-face` reza i
dve promenljive (`--font-family-primary`, `--font-family-content`). U JS-u i u
HTML-u imena nema nigde. U HTML-u je samo `preload`, i to **po četiri puta po
strani** — dva u SSR `<head>`-u i dva u RSC payload-u; mora na sva četiri
istovremeno, inače React posle hidracije vrati staro (vidi „Ključno pravilo").

## Objavljivanje na marmis.rs

Radni folder se **ne** šalje na server. `node _deploy-build.js` od njega pravi
`_deploy/` — 14,2 MB čiste statike koja radi bez `_local-server.js`:

```bash
node _deploy-build.js                        # -> _deploy/
node _deploy-preview.js _deploy 8100         # provera, servira kao Vercel
```

Build je jedini izvor istine za ono što je objavljeno; `_deploy/` se nikad ne
uređuje ručno, nego se pravi iznova. Svaka zakrpa u skripti se broji — ako se ne
primeni tačno onoliko puta koliko se očekuje, build pukne umesto da tiho
propusti izmenu. To je ovde jedini opasan ishod, pa je namerno.

### Šta build radi

| | |
|---|---|
| izbacuje | `_backup-*`, `realslike/`, `haljina_sa_lutkom/`, `marmis/_alati/`, izvorne slike i video iz korena, `ChatGPT Image *.png`, PDF |
| gasi tuđu telemetriju | PostHog (VERO-ov ključ `phc_nSNjy…`), Vercel Web Analytics, Vercel BotID, Sanity live events — vidi dole |
| briše | potpis `plutot.cool` u konzoli, `advisory@verostudio.com` iz poruke o grešci, `CALENDLY_LINK` ka VERO-ovom Calendly-ju |
| prevodi | poruku o grešci na srpski, sa telefonom umesto mejla |
| menja | `BASE_URL` i rezervni URL sa `verostudio.com` na `marmis.rs` (3 chunka) |
| pravi | `images/xei5vqg0/production/` kopije iz `media/` (15 fajlova) |
| ne šalje dvaput | tih 15 fajlova se iz `media/` izostavlja — ostaje samo ono na šta HTML pokazuje preko `/media/` (galerija + video) |
| apsolutizuje | `og:image` i `twitter:image` — skreperi odbacuju relativne putanje |
| piše | `sitemap.xml` sa punim URL-ovima, `site.webmanifest` kao **fajl** (u kopiji je folder), `vercel.json` |
| skida | `//# sourceMappingURL=` iz 49 fajlova — mape nisu ni skinute, bez ovoga svako otvaranje DevTools-a pravi 404 |

Domen je parametar: `node _deploy-build.js --domain https://drugi.rs`.

### Ugašena telemetrija

Sve je bilo VERO-ovo i na MARMIS sajtu nema šta da radi. Zakrpe su takve da
**broj React hook-ova ostaje isti** — `useEffect` ostaje na mestu, prazni mu se
telo — pa hidracija prolazi.

| šta | gde | kako |
|---|---|---|
| PostHog | `0pfr5ypyk26l~.js` | `init` ostaje definisan, poziv se briše |
| Vercel BotID | `0pfr5ypyk26l~.js` | `protect` lista se prazni; čuvao je `/checkout` koja ne postoji |
| Vercel Web Analytics | `0hk_b7xgkd4m6.js` | ubacivač skripte izlazi odmah |
| Sanity live events | `02unrdx1lxkac.js` | pretplata se briše iz `useEffect`-a |
| Sanity refresh | `02unrdx1lxkac.js` | `refreshOnFocus` i `refreshOnReconnect` na `false` |

Poslednje je izmereno, ne pretpostavljeno: **svaki povratak na tab** i svako
vraćanje mreže zvalo je `router.refresh()`, a pošto RSC payload na statičkom
hostingu ne postoji, to je svaki put povlačilo ceo HTML (~145 kB) i odbacivalo
ga. Posle zakrpe: nula neuspelih zahteva.

Ostaje jedno: Next `<Link>` pre-fetch šalje `?_rsc=…` na susednu stranu i
prekine je kad vidi da odgovor nije RSC. Navigacija posle toga radi kao običan
reload — za sajt od dve strane to je u redu. Petljanje po Next-ovom ruteru nije
vredno rizika.

### Postavljanje na Vercel

1. `vercel.json` je već u `_deploy/`: `cleanUrls`, `trailingSlash: false`,
   301 sa `/registry` na `/kontakt`, kes zaglavlja i tačan `content-type` za
   šest slika kojima se nastavak i sadržaj ne poklapaju (`.png` ime, JPEG bajtovi
   — vidi „Fotografije").
2. Framework preset mora biti **Other**, ne Next.js. Ovo je gotov build, ne izvor;
   ako Vercel pokuša da ga gradi kao Next projekat, pašće.
   Build command prazan, Output Directory prazan (root je `_deploy/`).
3. Iz `_deploy/`: `npx vercel --prod`. Ili prevuci folder na vercel.com/new.
4. Domen: Vercel → Project → Settings → Domains → `marmis.rs` i `www.marmis.rs`.
   Kod registrara postavi A zapis `76.76.21.21` za koren i CNAME
   `cname.vercel-dns.com` za `www` (Vercel pokaže tačne vrednosti).

**`cleanUrls` nije kozmetika.** Obe stranice preload-uju font relativnom
putanjom (`fonts/X.woff2`). Na `/kontakt` to se razreši na `/fonts/X.woff2`; na
`/kontakt/` bi bilo `/kontakt/fonts/X.woff2` → 404. Zato `trailingSlash: false`.
Isti razlog kao za mapiranje u `_local-server.js` (vidi „Ključno pravilo").

### Ostaje za rešiti

- **Izgled i kod su iz verostudio.com.** Sajt je i dalje njihov build sa
  promenjenim sadržajem.

(Fontovi su rešeni 2026-09-13 — vidi „Fontovi".)

## Obrisano iz originala

Ostale stranice (`/product`, `/gallery`, `/about`, `/process`,
`/featured-designers`, `/accessibility`, `/legals/*`), njihove slike i
`index-static.html` sa `assets/` folderom — ukupno ~1.9 GB.
