"use strict";

const DATA_URL = "https://raw.githubusercontent.com/klovery35/melih-devhub-data/refs/heads/main/devlog.json";

const pageTitle = document.querySelector("#page-title");
const pageSubtitle = document.querySelector("#page-subtitle");
const content = document.querySelector("#content");
const mobileNav = document.querySelector("#mobile-nav");
const menuToggle = document.querySelector("#menu-toggle");

document.querySelector("#year").textContent = new Date().getFullYear();

let appData = { projects: [], devlog: [] };
let loadError = null;

const routeInfo = {
  projects: ["Projects", "Yayınlanan ve geliştirme aşamasındaki oyun projelerim."],
  devlog: ["Devlog", "Projelerdeki son geliştirmeler ve ilerleme notları."],
  about: ["About", "Geliştirici ve öğrenci olarak üzerinde çalıştığım alanlar."],
  donate: ["Donate", "Bağımsız projelerime destek olmak istersen bağlantılar burada."],
  contact: ["Contact", "Proje, iş birliği veya geri bildirim için bana ulaşabilirsin."]
};

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.href) node.href = options.href;
  if (options.target) node.target = options.target;
  if (options.rel) node.rel = options.rel;
  if (options.src) node.src = options.src;
  if (options.alt !== undefined) node.alt = options.alt;
  for (const child of children) if (child) node.append(child);
  return node;
}

function clearContent() {
  content.replaceChildren();
}

function setHeading(route, customTitle = null, customSubtitle = null) {
  const info = routeInfo[route] || routeInfo.projects;
  pageTitle.textContent = customTitle || info[0];
  pageSubtitle.textContent = customSubtitle || info[1];
}

function setActive(route) {
  document.querySelectorAll("[data-route]").forEach(link => {
    const active = link.dataset.route === route;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function externalButton(text, url, primary = false) {
  const link = el("a", {
    className: `button${primary ? " primary" : ""}`,
    text,
    href: url || undefined,
    target: url ? "_blank" : undefined,
    rel: url ? "noopener noreferrer" : undefined
  });
  if (!url) link.setAttribute("aria-disabled", "true");
  return link;
}

function placeholderIcon(sizeClass = "project-icon") {
  return el("div", { className: `${sizeClass} placeholder`, text: "🎮" });
}

function projectIcon(project, className) {
  if (!project.icon) return placeholderIcon(className);
  const image = el("img", { className, src: project.icon, alt: `${project.title || "Proje"} ikonu` });
  image.addEventListener("error", () => image.replaceWith(placeholderIcon(className)), { once: true });
  return image;
}

function slugify(value) {
  return String(value || "project")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function showStatus(message, isError = false) {
  clearContent();
  content.append(el("div", { className: `status-card${isError ? " error" : ""}`, text: message }));
}

function renderProjects() {
  setHeading("projects");
  setActive("projects");
  clearContent();

  if (!appData.projects?.length) {
    showStatus(loadError ? "Proje verileri şu anda yüklenemedi." : "Henüz proje verisi yok.", Boolean(loadError));
    return;
  }

  const grid = el("div", { className: "projects-grid" });
  appData.projects.forEach(project => {
    const title = el("h2", { text: project.title || "İsimsiz Proje" });
    const status = el("p", { className: "meta-line", text: `Durum: ${project.status || "Belirtilmedi"}` });
    const platform = el("p", { className: "meta-line", text: `Platform: ${project.platform || "PC"}` });
    const copy = el("div", { className: "project-copy" }, [title, status, platform]);
    const top = el("div", { className: "project-top" }, [copy, projectIcon(project, "project-icon")]);
    const description = el("p", { className: "project-description", text: project.short_description || project.description || "" });

    const detail = el("a", { className: "button", text: "Detayları Gör", href: `#project/${slugify(project.title)}` });
    const open = externalButton(project.button || "Aç", project.url || "", true);
    const actions = el("div", { className: "card-actions" }, [detail, open]);
    grid.append(el("article", { className: "project-card" }, [top, description, actions]));
  });
  content.append(grid);
}

function renderProjectDetail(slug) {
  const project = appData.projects?.find(item => slugify(item.title) === slug);
  if (!project) {
    setHeading("projects", "Project Not Found", "Aradığın proje bulunamadı.");
    setActive("projects");
    showStatus("Bu proje bulunamadı veya veri kaynağından kaldırılmış olabilir.", true);
    return;
  }

  setHeading("projects", project.title || "Project Detail", `${project.status || ""}${project.platform ? ` • ${project.platform}` : ""}`);
  setActive("projects");
  clearContent();

  const info = el("div", {}, [
    el("h2", { text: project.title || "İsimsiz Proje" }),
    el("p", { className: "meta-line", text: `Durum: ${project.status || "Belirtilmedi"}` }),
    el("p", { className: "meta-line", text: `Platform: ${project.platform || "PC"}` })
  ]);
  const hero = el("div", { className: "detail-hero" }, [info, projectIcon(project, "detail-icon")]);
  const card = el("article", { className: "detail-card" }, [hero]);
  card.append(el("p", { className: "detail-description", text: project.description || project.short_description || "" }));

  if (project.screenshots?.length) {
    card.append(el("h3", { className: "section-title", text: "Screenshots" }));
    const shots = el("div", { className: "screenshot-grid" });
    project.screenshots.slice(0, 10).forEach((src, index) => {
      const img = el("img", { src, alt: `${project.title} ekran görüntüsü ${index + 1}` });
      const link = el("a", { href: src, target: "_blank", rel: "noopener noreferrer" }, [img]);
      shots.append(link);
    });
    card.append(shots);
  }

  const actions = el("div", { className: "detail-actions" });
  if (project.url) actions.append(externalButton(project.button || "Sayfayı Aç", project.url, true));
  actions.append(el("a", { className: "button", text: "← Projelere Geri Dön", href: "#projects" }));
  card.append(actions);
  content.append(card);
}

function renderDevlog() {
  setHeading("devlog");
  setActive("devlog");
  clearContent();

  if (!appData.devlog?.length) {
    showStatus(loadError ? "Devlog verileri şu anda yüklenemedi." : "Henüz devlog yok.", Boolean(loadError));
    return;
  }

  const list = el("div", { className: "devlog-list" });
  [...appData.devlog].reverse().forEach(entry => {
    const time = el("time", { text: entry.date || "" });
    if (entry.date) time.dateTime = entry.date;
    list.append(el("article", { className: "devlog-entry" }, [
      time,
      el("h2", { text: entry.title || "Güncelleme" }),
      el("p", { text: entry.text || "" })
    ]));
  });
  content.append(list);
}

function renderAbout() {
  setHeading("about");
  setActive("about");
  clearContent();
  const card = el("article", { className: "text-card" });
  [
    "Merhaba, ben Çağrı.",
    "PC oyunları, gameplay sistemleri ve interaktif deneyimler geliştirmeyi hobi olarak yapan bağımsız bir oyun geliştiricisiyim.",
    "Özellikle Godot ile mekanik tasarımı, oyun hissi ve atmosfer üzerine çalışıyorum.",
    "Aynı zamanda İzmir Demokrasi Üniversitesi Elektrik-Elektronik Mühendisliği 4. sınıf öğrencisiyim.",
    "Yazılım, oyun teknolojileri ve mühendislik alanlarında kendimi geliştirmeye devam ediyorum."
  ].forEach(text => card.append(el("p", { text })));
  content.append(card);
}

function renderDonate() {
  setHeading("donate");
  setActive("donate");
  clearContent();
  const card = el("article", { className: "text-card" });
  card.append(
    el("h2", { text: "Projelerime destek olmak ister misin?" }),
    el("p", { text: "Klovery Games ve geliştirdiğim bağımsız PC oyunları hobi olarak ilerleyen projelerdir. Desteklerin yeni oyun sistemleri, assetler, görsel içerikler ve geliştirme süreci için motivasyon sağlar." })
  );
  const links = el("div", { className: "link-stack" }, [
    externalButton("☕ Buy Me a Coffee ile Destek Ol", "https://buymeacoffee.com/KloverY", true)
  ]);
  card.append(links);
  content.append(card);
}

function renderContact() {
  setHeading("contact");
  setActive("contact");
  clearContent();
  const card = el("article", { className: "text-card" });
  card.append(el("p", { text: "E-posta: melihcagridayi@gmail.com" }));
  card.append(el("div", { className: "link-stack" }, [
    externalButton("✉️ E-posta Gönder", "mailto:melihcagridayi@gmail.com"),
    externalButton("🎮 itch.io Profilim", "https://melihcagridayi.itch.io"),
    externalButton("💻 GitHub Profilim", "https://github.com/klovery35")
  ]));
  content.append(card);
}

function renderRoute() {
  const rawHash = location.hash.replace(/^#/, "") || "projects";
  const [route, slug] = rawHash.split("/");

  switch (route) {
    case "projects": renderProjects(); break;
    case "project": renderProjectDetail(slug || ""); break;
    case "devlog": renderDevlog(); break;
    case "about": renderAbout(); break;
    case "donate": renderDonate(); break;
    case "contact": renderContact(); break;
    default:
      history.replaceState(null, "", "#projects");
      renderProjects();
  }

  mobileNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Menüyü aç");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadData() {
  setHeading("projects", "Loading...", "Proje verileri yükleniyor.");
  showStatus("Veriler yükleniyor...");
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || typeof data !== "object") throw new Error("Geçersiz JSON");
    appData = {
      projects: Array.isArray(data.projects) ? data.projects : [],
      devlog: Array.isArray(data.devlog) ? data.devlog : []
    };
  } catch (error) {
    console.error("Veri yükleme hatası:", error);
    loadError = error;
  }
  renderRoute();
}

menuToggle.addEventListener("click", () => {
  const open = mobileNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
});

window.addEventListener("hashchange", renderRoute);
loadData();
