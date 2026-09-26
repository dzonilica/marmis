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
