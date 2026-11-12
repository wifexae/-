/* ============================================================
   НАСТРОЙКИ КЛИЕНТА — заменить перед публикацией.
   Пока значения-заглушки (нули), ссылки на мессенджеры/телефон
   отключены, а на странице показана плашка «Демо-версия».
   ============================================================ */
const CONTACT = {
  phoneDisplay: "+7 000 000-00-00",
  phoneRaw: "+70000000000",
  telegram: "",            // username без @, например "studio_name"
  whatsapp: "",            // номер в формате 70000000000, без + и пробелов
  email: "hello@example.com",
  address: "Адрес уточняется",
  hours: "Ежедневно, 09:00–20:00"
};

/* Цены — в атрибутах data-s / data-m / data-l в index.html */
const CLASS_LABEL = {
  s: "седана / хэтчбека",
  m: "кроссовера",
  l: "внедорожника / минивэна"
};

(function () {
  "use strict";

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  var hasTelegram = /^[A-Za-z0-9_]{5,32}$/.test(CONTACT.telegram);
  var hasWhatsapp = /^\d{10,15}$/.test(CONTACT.whatsapp);
  var hasPhone = /^\+\d{10,15}$/.test(CONTACT.phoneRaw) && !/^\+\d?0{8,}$/.test(CONTACT.phoneRaw);
  var hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACT.email) && !/@example\.(com|org|net)$/i.test(CONTACT.email);
  var isPlaceholder = !(hasTelegram || hasWhatsapp || hasPhone || hasEmail);

  var state = { cls: "s", pkg: "" };

  /* ---------- Контакты ---------- */
  $$("[data-fill]").forEach(function (el) {
    var key = el.getAttribute("data-fill");
    var map = { phone: CONTACT.phoneDisplay, email: CONTACT.email, address: CONTACT.address, hours: CONTACT.hours };
    if (map[key]) el.textContent = map[key];
  });

  var notice = $("#demo-notice");
  if (notice) notice.hidden = !isPlaceholder;

  function message(pkg, cls) {
    var parts = ["Здравствуйте!"];
    if (pkg) parts.push("Интересует пакет «" + pkg + "» для " + CLASS_LABEL[cls] + ".");
    else parts.push("Хочу записаться на осмотр автомобиля.");
    parts.push("Подскажите стоимость и ближайшее время.");
    return parts.join(" ");
  }

  function setLink(el, href, external) {
    el.setAttribute("href", href);
    if (external) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); }
    else { el.removeAttribute("target"); }
    el.removeAttribute("aria-disabled");
  }

  function disableLink(el, hint) {
    el.setAttribute("href", "#contacts");
    el.removeAttribute("target");
    el.setAttribute("aria-disabled", "true");
    if (hint) el.setAttribute("title", hint);
  }

  function linkFor(kind, pkg, cls) {
    var text = encodeURIComponent(message(pkg, cls));
    if (kind === "telegram" && hasTelegram) return "https://t.me/" + CONTACT.telegram + "?text=" + text;
    if (kind === "whatsapp" && hasWhatsapp) return "https://wa.me/" + CONTACT.whatsapp + "?text=" + text;
    if (kind === "phone" && hasPhone) return "tel:" + CONTACT.phoneRaw;
    if (kind === "email" && hasEmail) {
      return "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent("Заявка на детейлинг") + "&body=" + text;
    }
    return null;
  }

  /* Первый доступный канал для кнопок «Записаться» в тарифах */
  function bestChannel(pkg, cls) {
    var order = ["telegram", "whatsapp", "email", "phone"];
    for (var i = 0; i < order.length; i++) {
      var href = linkFor(order[i], pkg, cls);
      if (href) return { href: href, external: order[i] === "telegram" || order[i] === "whatsapp" };
    }
    return null;
  }

  function refreshLinks() {
    $$(".js-cta").forEach(function (a) {
      var res = bestChannel(a.getAttribute("data-package"), state.cls);
      if (res) setLink(a, res.href, res.external);
      else disableLink(a);
    });
    $$(".js-contact").forEach(function (a) {
      var kind = a.getAttribute("data-kind");
      var href = linkFor(kind, state.pkg, state.cls);
      if (href) setLink(a, href, kind === "telegram" || kind === "whatsapp");
      else disableLink(a, "Контакт не задан (демо-версия)");
    });
  }

  /* Клик по CTA в тарифах — запоминаем пакет для блока контактов */
  $$(".js-cta").forEach(function (a) {
    a.addEventListener("click", function () {
      state.pkg = a.getAttribute("data-package");
      refreshLinks();
    });
  });

  /* ---------- Табы классов автомобиля ---------- */
  var tabs = $$(".tab");
  var panel = $("#plans");
  var nf = new Intl.NumberFormat("ru-RU");

  function setClass(cls, focus) {
    state.cls = cls;
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-class") === cls;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on) {
        if (panel) panel.setAttribute("aria-labelledby", t.id);
        if (focus) t.focus();
      }
    });
    $$("[data-price]").forEach(function (el) {
      var v = Number(el.getAttribute("data-" + cls));
      if (!isNaN(v)) el.textContent = nf.format(v);
    });
    refreshLinks();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { setClass(t.getAttribute("data-class"), false); });
    t.addEventListener("keydown", function (e) {
      var n = tabs.length, j = -1;
      if (e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      if (j > -1) { e.preventDefault(); setClass(tabs[j].getAttribute("data-class"), true); }
    });
  });

  /* ---------- Мобильное меню и шапка ---------- */
  var header = $(".header");
  var burger = $("#burger");
  var nav = $("#nav");

  function setMenu(open) {
    if (!burger || !nav) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav.classList.toggle("is-open", open);
    if (header) header.classList.toggle("is-open", open);
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { setMenu(false); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 760) setMenu(false); });
  }

  function onScroll() {
    if (header) header.classList.toggle("is-stuck", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Появление блоков при прокрутке ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Прочее ---------- */
  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  setClass("s", false);
})();
