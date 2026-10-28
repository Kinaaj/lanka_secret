# ⚡ LANKA 2027 – Bratrský souboj 5v5

Vítej na oficiálním webu pro naši domácí LAN párty! Stránka je navržena pro čistý hosting přes **GitHub Pages** (čisté HTML5, moderní CSS3 a Vanilla JavaScript bez nutnosti buildu).

---

## 🎮 O projektu

- **Formát:** 10 hráčů celkem (2 bráchové jako kapitáni + 8 kamarádů) rozdělených do dvou týmů 5v5.
- **Modrý tým (Blue Team):** Vede brácha v modrém tričku (obranná taktika, chladná hlava).
- **Červený tým (Red Team):** Vedu já v červeném tričku (agresivní útok, adrenalin).
- **Vizuální styl:** Rozdělení na 3 hlavní části se cik-cak bleskovými oddělovači (lightning bolt dividers), interaktivním efektem aktivace a neonovou září při najetí myší a odpočtem do akce.

---

## 📸 Jak vyměnit fotky kapitánů za vaše skutečné vyříznuté fotky

Vygenerovali jsme pro vás dva ukázkové esportové portréty, které můžete kdykoliv nahradit svými vlastními vyříznutými fotkami (např. PNG s průhledným pozadím nebo JPG):

1. Svoji fotku v červeném tričku ulož do:
   `assets/images/captain_red.jpg` (nebo `.png`)
2. Bráchovu fotku v modrém tričku ulož do:
   `assets/images/captain_blue.jpg` (nebo `.png`)
3. Pokud změníte formát na `.png`, stačí v souboru [`index.html`](file:///c:/Users/Programming/Documents/lanka/index.html) upravit cestu v tagu `<img>`.

---

## 🚀 Jak zapnout GitHub Pages

1. Pushni tento repozitář na svůj GitHub:
   ```bash
   git add .
   git commit -m "Lanka 2027 epic landing page"
   git push origin main
   ```
2. Na GitHubu otevři **Settings** repozitáře.
3. V levém menu klikni na **Pages**.
4. V sekci **Build and deployment** vyber **Source: Deploy from a branch**.
5. Vyber větev `main` (nebo `master`) a složku `/ (root)`, poté klikni na **Save**.
6. Během minuty bude tvůj web dostupný na adrese:
   `https://<tve-jmeno>.github.io/<nazev-repozitare>/`

---

## 🛠️ Lokální spuštění

Web můžete otevřít přímo dvojklikem na soubor [`index.html`](file:///c:/Users/Programming/Documents/lanka/index.html) v prohlížeči, nebo spustit lokální server:

```bash
# Přes Python
python -m http.server 8080

# Nebo přes Node.js
npx serve
```
Pak otevřete `http://localhost:8080`.