# MARMIS — SEO pregled, 25. septembar 2026.

Pregledani su izvorni fajlovi i rezultat produkcionog builda. Javni marmis.rs nije bilo moguće učitati kroz alate u ovoj sesiji. Korisnik je potvrdio da je sajt objavljen i da je dodao njegov link u Google Business Profile. Bez Search Console podataka nije potvrđeno stanje indeksiranja, izabrani canonical, pozicije ili razlog eventualnog pada.

## Da li preuzeti Vero kod obara SEO?

Nema pronađenog dokaza za to. Na obe stranice canonical upućuje na marmis.rs, jezik je srpski, indeksiranje je dozvoljeno, a poslovni podaci pripadaju MARMIS-u. Vidljivi tekst je o šivenju; prema dokumentaciji projekta, fotografije su zamenjene korisnikovim materijalom.

Postojeći build već isključuje originalnu PostHog/Vercel analitiku i Sanity live pretplatu, menja Vero URL-ove i uklanja njihovu adresu iz poruke o grešci. Zato treba objavljivati rezultat `node _deploy-build.js`, a ne sirovu kopiju foldera. Pojava `noindex` u generičkom Next.js kodu za stranice greške nije zabrana indeksiranja početne.

Sličan izgled ili zajednički programski kod nisu isto što i kopiran glavni sadržaj. Google razmatra sadržaj i kanonske stranice; sam nalaz preuzetog koda ne dokazuje kaznu. [Google: SEO vodič i duplirani sadržaj](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [canonicalizacija](https://developers.google.com/search/docs/crawling-indexing/canonicalization).

## Pronađeno i izmenjeno

- Početni H1 bio je „Šivenje po meri za vaš savršen kroj.“ Sada je „Šivenje po meri u Kragujevcu.“
- Naslov početne je sada „Šivačka radnja Kragujevac | MARMIS modni studio“. Kontakt ima svoj naslov; metapodaci i podaci koje React koristi usklađeni su.
- Uvod jasno opisuje šivačku radnju i modni studio. Dodati su konkretni opisi izbora modela, uzimanja mera, probe i haljina iz postojeće galerije, uz naslov „Haljine po meri u Kragujevcu.“ Nisu izmišljene cene, rokovi ili nove usluge.
- Strukturirani podaci sada uključuju i uslugu šivenja haljina po meri. Opis slike za deljenje usklađen je sa fotografijom haljine.
- Build uklanja preostale nepotrebne preconnect/DNS veze ka tuđem Sanity projektu, u HTML-u i React Flight podacima.
- Opcija `--domain` sada usklađuje canonical, OG i strukturirane podatke sa domenom sitemap-a. Za sadašnji podrazumevani marmis.rs ovo ranije nije bio blokator.
- Sitemap više ne prijavljuje datum svakog builda kao datum promene sadržaja. To je korekcija tačnosti, ne dokaz prethodne SEO kazne.

Vidljiva kontakt strana i dalje nema adresu. „Kneginje Ljubice 2, Kragujevac“ postoji u strukturiranim podacima; javni prikaz nije dodat bez potvrde da je adresa tačna i namenjena prikazivanju. Poslovni podaci na sajtu i GBP profilu treba da budu usklađeni. [Google: pravila strukturiranih podataka](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Sledeći koraci na objavljenom sajtu

1. Objaviti ovaj build. Izmene u ovoj sesiji su lokalne; nisu poslate na produkciju.
2. U Google Search Console proveriti `https://marmis.rs/` i `https://marmis.rs/kontakt`: status indeksiranja, Google-selected canonical i prikaz stranice kroz URL Inspection. Predati `https://marmis.rs/sitemap.xml` i zatražiti ponovno indeksiranje izmenjenih stranica. [Google: poslovni sajt i Search Console](https://developers.google.com/search/docs/appearance/establish-business-details).
3. Na GBP profilu proveriti verifikaciju, kategoriju koja stvarno opisuje posao, telefon, adresu, radno vreme i fotografije sopstvenih radova. Link ka sajtu je dodat prema potvrdi korisnika. Stvarne recenzije klijenata i potpun profil mogu pomoći lokalnom rangiranju; udaljenost korisnika takođe utiče na rezultat. [Google: lokalno rangiranje](https://support.google.com/business/answer/7091?hl=en).
4. Meriti upite „šivačka radnja Kragujevac“, „modni studio Kragujevac“ i „haljine Kragujevac“ kroz Search Console. Nema potrebe praviti iste stranice za varijante sa i bez kvačica. Posebna stranica o haljinama ima smisla kada donosi dodatne radove, odgovore i konkretne informacije, a ne ponovljen tekst početne.
5. Izmeriti mobilni PageSpeed i Core Web Vitals. Početna direktno referencira oko 1,46 MB nekompresovanog JavaScript-a (oko 463 KB gzip); desktop video ima 2,47 MB, mobilni 0,81 MB, a 3D model 2,58 MB. To su veličine fajlova, ne izmeren transfer u browseru ili dokaz lošeg LCP/INP. Postojeća skripta već sprečava nepotrebno preuzimanje skrivene varijante videa. Dalja optimizacija treba da bude zasnovana na merenju.

## Provera izmena

`node _deploy-build.js` prolazi sa 29 zakrpa. `node _seo-check.cjs --url http://localhost:8100` proverava SEO metapodatke, podudaranje JSON-LD između HTML-a i React podataka, naslove, parsiranje Flight podataka, lokalne resurse i linkove, sitemap, robots.txt i HTTP odgovore, uključujući preusmerenje sa stare kontakt rute.

Provera alternativnog domena i zaštite izlaznog foldera takođe je prošla. Prikaz u browseru i stvarna React hidracija nisu provereni jer browser nije dostupan u ovoj sesiji. Izmene ne garantuju poziciju; učinak se ocenjuje nakon Google-ovog ponovnog obilaska i kroz podatke o prikazima i klikovima.

## Dopuna, 26. septembar 2026. (Search Console + PageSpeed + Maps)

Ovog puta su bili dostupni podaci sa objavljenog sajta.

**Izmene iz prethodne sesije nisu bile objavljene.** `https://marmis.rs/` je i dalje vracao stari naslov „Marmis - modni studio u Kragujevcu“ i stari H1 „Sivenje po meri za vas savrsen kroj.“ Pad prikaza u Search Console-u zato ne meri te izmene.

**Search Console, poslednjih 7 dana:** 9 klikova, 13 prikaza, jedini upit „marmis“. Na tom obimu procentualne promene su sum. Za „modni studio Kragujevac“, „haljine Kragujevac“ i „sivenje haljina Kragujevac“ nema nijedan prikaz, sto znaci da Google ne nalazi razlog da stranu uvrsti u te rezultate. To je pitanje kolicine sadrzaja, ne kazne.

**http i https su dva unosa u indeksu.** Preusmerenja su provrena i ispravna su: `http://marmis.rs/` -> 308 -> `https://marmis.rs/`, `https://www.marmis.rs/` -> 308 -> `https://marmis.rs/`. Ostatak u indeksu se sam konsoliduje.

**PageSpeed, mobilni:** SEO 100, Best Practices 96, Accessibility 93, Performance 57. LCP 4,5 s, TBT 1020 ms, ukupno 4662 KiB. CrUX nema podatke sa terena (premalo poseta), pa je merenje laboratorijsko.

### Uradjeno u ovoj sesiji

- **Adresa je sada vidljiva** na /kontakt, kao druga stavka pored Telefona, povezana sa Google Maps profilom. Korisnik je potvrdio da sme. Dodata je na sva tri mesta gde tekst stoji: SSR HTML, RSC payload i i18n recnik.
- **ClothingStore JSON-LD dobio `geo`** (44.0097165, 20.9159192) **i `hasMap`** (`https://maps.google.com/?cid=14591823223998143789`), oba sa stvarnog Maps profila, na obe strane i u obe kopije.
- **Hero video je dobio poster** (`media/hero-still.jpg` 28 KB, `media/hero-mobile-still.jpg` 16 KB, prvi kadar iz ffmpeg-a). Bez postera pregledac mora da skine deo videa pre nego sto isto naslika, sto je najverovatniji uzrok LCP-a od 4,5 s.
- Komponenta `Media` sa originalnog sajta prosledjuje `<video>`-u samo unapred poznata svojstva, a React pri hidraciji izbaci cele SSR `<video>` elemente i napravi nove. Zato se poster drzi iz `marmis/media-mobile.js`, po mapi `POSTERS` (src -> poster), sve dok video stvarno ne krene. Provereno u pregledacu: sa namerno usporenim videom poster stoji u svih 28 uzoraka; bez te izmene nestajao je posle ~300 ms. React chunkovi nisu dirani.

- **Radno vreme je dodato**, posto ga je korisnik dao sa GBP profila: ponedeljak do subote 8 do 18, nedeljom zatvoreno. Stoji kao `openingHoursSpecification` u JSON-LD-u (nedelja kao `opens`/`closes` 00:00, kako Google dokumentuje zatvoren dan) i kao vidljiva treca stavka „Radno vreme“ na /kontakt, opet na sva tri mesta. Vidljivo i oznaceno se poklapaju, kako trazi pravilo o strukturiranim podacima.

`sameAs` nije dodat jer Instagram jos ne postoji.

### Sta nije mereno

Nova LCP vrednost. Merenje je moguce tek kad build ode na produkciju, kroz PageSpeed na `https://marmis.rs/`. Poster smanjuje ono sto pregledac mora da skine pre prvog kadra, ali koliko to pomera LCP na terenu pokazuje tek merenje.

## Dopuna, 26. septembar 2026, uvece (PageSpeed izvestaj)

Novi izvestaj sa objavljenog sajta: Performance 62, Accessibility 93, Best Practices 96, SEO 100, Agentic Browsing 1/2. FCP 1,4 s, LCP 3,3 s, TBT 1050 ms, CLS 0, Speed Index 7,9 s.

Provera je radjena lokalno, Lighthouse-om iz istog pregledaca nad `_deploy` buildom, i puppeteer-om za pojedinacne provere.

### Ispravljeno

- **Link u zaglavlju nije imao ime.** Ispod 930px sajt gasi tekst dugmeta sa `display:none` i ostavlja samo ikonicu, pa je `<a href="/kontakt">` za citace ekrana bio prazan. To je obaralo i Accessibility i jedini pali test u Agentic Browsing-u. Tekst se sada ne gasi nego sakriva na standardan nacin (1 px i `clip`), pa dugme izgleda isto, a ime linka je „Zakazi TERMIN". Provereno kroz stablo pristupacnosti pregledaca.
- **Sivi tekst nije imao kontrast.** `--color-grey-600` je bio `#979696`, sto na bez podlozi `#f3f0ed` daje 2,6:1, a WCAG AA trazi 4,5:1. Sada je `#6b6a69`, odnosno 4,75:1. Lighthouse je prijavio samo potpis u futeru, ali isti sivi tekst nosi i **telefon, adresa, radno vreme i uvodni pasus na /kontakt**, dakle bas ono zbog cega ljudi otvaraju tu stranu. Provereno je da na obe strane, i na telefonu i na desktopu, nijedan takav tekst ne stoji na tamnoj podlozi.
- **Accessibility je posle ovoga 100 na obe strane** (mereno lokalno), a pali test u Agentic Browsing-u je bio bas taj link.
- **Kes.** Slike, video i 3D su imali dan, pomocne datoteke iz `marmis/` sat vremena; Lighthouse je zbog toga trazio 368 KiB (najvise hero video, 810 KB). Sada je za `media`, `images` i `webgl` nedelja dana uz mesec dana `stale-while-revalidate`, a `marmis/` ide godinu dana jer HTML te datoteke zove sa `?v=<otisak sadrzaja>`, pa nova verzija dobija novu adresu.
- **Dva zahteva pre prvog piksela manje.** `marmis/galerije.css` i `marmis/media-mobile.js` moraju da stignu pre iscrtavanja (drugi mora pre nego sto parser napravi `<video>`). Build ih sada upisuje u sam HTML, bez komentara, pa HTML raste sa 150 na 153 KB, a dva odlaska na mrezu nestaju. Preostale dve skripte idu sa `defer` i ne blokiraju.
- **Prinudni preracun rasporeda u nasim skriptama.** `marmis/galerije.js` je merio sve galerije odmah po ucitavanju, pa jos jednom na `load` i na `fonts.ready`; sada se mere tek kad dodju blizu ekrana. `marmis/koraci-mobile.js` je u istoj petlji naizmenicno pisao i citao raspored; sada prvo cita sve, pa onda pise. Lighthouse je toj dvema skriptama pripisivao oko 366 ms glavne niti.

### Provereno da nije uzrok

- **Uvodna animacija sa procentima nije kriva za LCP.** Traje 2,3 s po tajmeru (`t/2300` u chunk-u), plus otkrivanje. Merenje sa iskljucenom animacijom nije dalo bolji LCP (10,1 s prema 10,4 s lokalno), a Speed Index je bio losiji. Zato nije dirana.
- **Greska u konzoli (React #418, „hydration mismatch").** Nije od nasih izmena: javlja se i na netaknutoj kopiji u `_backup-original/index.html`, sa originalnim chunkovima. Zbog nje React odbaci ceo SSR HTML i iscrta stranu iznova na klijentu, sto se vidi i u DOM-u (u 606. milisekundi se prazne `<head>` i `<body>`). Zivi verostudio.com danas nema tu gresku, ali je on u medjuvremenu objavljen iz novijeg builda (`dpl_6syx...` prema nasem `dpl_5DJL...`), pa poredjenje ne pokazuje sta je tacno u nasoj kopiji drugacije. Ovo kosta 4 poena u Best Practices i deo TBT-a, a za pravu ispravku treba izvorni kod aplikacije.

### Ostaje neresivo bez izvornog koda

Zastareli JavaScript (22 KiB polyfill-a), neiskorisceni JavaScript (102 KiB) i najveci deo od 1050 ms TBT-a. Glavna nit najvise radi u `0pfr5ypyk26l~.js` (3,7 s, od toga 2,5 s izvrsavanja), a to je React runtime originalne aplikacije. Poster mobilnog hero videa je 540x1080 za prikaz od 463x823, sto Lighthouse racuna kao 6 KiB viska; ostavljen je veci da ne bi bio mutan na ekranima sa dvostrukom gustinom.

### Sta tek treba izmeriti

Performance posle objave. Lokalno merenje na ovoj masini daje losije brojeve od PageSpeed-a (LCP 10 s prema 3,3 s) i sluzi samo za poredjenje pre i posle. Kad build ode na produkciju, ponoviti PageSpeed na `https://marmis.rs/`.
