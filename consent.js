/* consent.js — self-hosted consent gate for GA4 (Google Consent Mode v2)
   Law 25 / PIPEDA compliant: analytics denied by default until the visitor accepts.
   No third-party SaaS. Bilingual EN/FR. Choice persisted in localStorage. */
(function () {
  "use strict";
  var KEY = "ci_consent_v1";
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  var prior = null;
  try { prior = localStorage.getItem(KEY); } catch (e) {}

  if (prior === "granted") {
    gtag("consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
    return; // already decided, no banner
  }
  if (prior === "denied") { return; } // stays denied by default, no banner

  function apply(state) {
    try { localStorage.setItem(KEY, state); } catch (e) {}
    if (state === "granted") {
      gtag("consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
    }
    var b = document.getElementById("ci-consent"); if (b) b.parentNode.removeChild(b);
  }

  function build() {
    var css = document.createElement("style");
    css.textContent =
      "#ci-consent{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#0A3161;color:#F2EFE9;" +
      "font-family:'Source Sans 3',system-ui,Arial,sans-serif;font-size:14px;line-height:1.45;" +
      "border-top:2px solid #D4AF37;box-shadow:0 -6px 24px rgba(0,0,0,.35)}" +
      "#ci-consent .ci-wrap{max-width:1080px;margin:0 auto;padding:16px 20px;display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:space-between}" +
      "#ci-consent p{margin:0;flex:1 1 460px;min-width:260px}" +
      "#ci-consent a{color:#D4AF37;text-decoration:underline}" +
      "#ci-consent .ci-btns{display:flex;gap:10px;flex:0 0 auto}" +
      "#ci-consent button{font:inherit;font-weight:600;cursor:pointer;border-radius:3px;padding:9px 18px;border:1px solid #D4AF37}" +
      "#ci-consent .ci-accept{background:#D4AF37;color:#0A3161}" +
      "#ci-consent .ci-decline{background:transparent;color:#F2EFE9}" +
      "@media(max-width:640px){#ci-consent .ci-btns{width:100%}#ci-consent button{flex:1}}";
    document.head.appendChild(css);

    var bar = document.createElement("div");
    bar.id = "ci-consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Cookie consent / Consentement aux témoins");
    bar.innerHTML =
      '<div class="ci-wrap">' +
      '<p>We use analytics cookies to understand site usage. You can accept or decline. ' +
      '<span lang="fr">&mdash; Nous utilisons des t&eacute;moins d&rsquo;analyse pour comprendre l&rsquo;utilisation du site. Vous pouvez accepter ou refuser.</span> ' +
      '<a href="/cookies.html">Details / D&eacute;tails</a></p>' +
      '<div class="ci-btns">' +
      '<button type="button" class="ci-decline">Decline / Refuser</button>' +
      '<button type="button" class="ci-accept">Accept / Accepter</button>' +
      '</div></div>';
    document.body.appendChild(bar);
    bar.querySelector(".ci-accept").addEventListener("click", function () { apply("granted"); });
    bar.querySelector(".ci-decline").addEventListener("click", function () { apply("denied"); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

/* ---------------------------------------------------------------------------
   EN/FR language toggle — added 2026-09-09 (uniform bilingual SOP, unified
   with the mechanism already live on josephsoares.com).

   Renders a toggle link derived from the hreflang alternates already in
   <head> — any page that declares a French/English twin gets the toggle
   with no per-page markup. Renders nothing when the page has no
   counterpart, so this is safe to load unconditionally on every page.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";
  var PATH = location.pathname.replace(/^\/+/, "");

  function altPath(hl) {
    var l = document.querySelector('link[rel="alternate"][hreflang="' + hl + '"]');
    if (!l) return null;
    var href = l.getAttribute("href") || "";
    if (!href) return null;
    var p;
    try { p = new URL(href, location.origin).pathname; } catch (e) { return null; }
    return p.replace(/^\/+/, "") === PATH ? null : p;
  }

  function run() {
    var lang = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    var isFr = lang.indexOf("fr") === 0;
    var target = isFr ? altPath("en") : (altPath("fr-CA") || altPath("fr"));
    if (!target) return;

    var nav = document.querySelector("nav");
    if (!nav) return;

    var css = document.createElement("style");
    css.textContent =
      "nav .lang-toggle{font-family:'Cormorant Garamond',serif;font-size:.85rem;font-weight:600;" +
      "letter-spacing:1px;color:#d4b86a;text-decoration:none;border:1px solid rgba(201,168,76,.4);" +
      "padding:.35rem .8rem;margin-left:.75rem;border-radius:2px;transition:all .3s ease}" +
      "nav .lang-toggle:hover{background:#c9a84c;color:#0c1a2e}";
    document.head.appendChild(css);

    var a = document.createElement("a");
    a.className = "lang-toggle";
    a.href = target;
    a.setAttribute("hreflang", isFr ? "en" : "fr-CA");
    a.title = isFr ? "Read this page in English" : "Lire cette page en français";
    a.setAttribute("aria-label", a.title);
    a.textContent = isFr ? "EN" : "FR";
    nav.appendChild(a);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();

/* ---------------------------------------------------------------------------
   Wide tables scroll inside their own box, not the page - added 2026-09-14.

   Ported from josephsoares.com, where the same fault was found by rendering
   every page at 375x812 rather than by reading the viewport meta tag. Here it
   was the cookie table: cookies.html overflowed by 158px and cookies-fr.html
   by 145px on a phone, so the whole page scrolled sideways.

   A viewport meta tag is not mobile-first. This is the check that is: render
   at 375 wide and measure scrollWidth against clientWidth.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";

  function css() {
    if (document.getElementById("ci-tscroll-css")) return;
    var st = document.createElement("style");
    st.id = "ci-tscroll-css";
    st.textContent = ".ci-tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}";
    document.head.appendChild(st);
  }

  function run() {
    var ts = document.querySelectorAll("table"), i, t, host, d;
    for (i = 0; i < ts.length; i++) {
      t = ts[i]; host = t.parentNode;
      if (!host || host.className === "ci-tscroll") continue;
      if (t.scrollWidth <= host.clientWidth + 2) continue;
      css();
      d = document.createElement("div"); d.className = "ci-tscroll";
      host.insertBefore(d, t); d.appendChild(t);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
