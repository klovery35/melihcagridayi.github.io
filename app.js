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
let isLoading = true;

const routeInfo = {
  projects: ["Oyunlar", "Yayınlanan ve geliştirme aşamasındaki oyun projelerim."],
  devlog: ["Geliştirme Günlüğü", "Oyunlar ve teknik çalışmalar hakkındaki ilerleme notları."],
  school: ["Projeler", "Mühendislik eğitimim ve uygulamalı çalışmalarım."],
  home: ["Klovery Games", ""]
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
  pageTitle.textContent = customTitle ?? info[0];
  const subtitle = customSubtitle ?? info[1];
  pageSubtitle.textContent = subtitle;
  pageSubtitle.hidden = !subtitle;
}


function safeWebUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value, location.href);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function externalButton(text, url, primary = false) {
  // Only regular web addresses may become remote, clickable project links.
  const safe = safeWebUrl(url);
  const link = el("a", {
    className: `button${primary ? " primary" : ""}`,
    text,
    href: safe || undefined,
    target: safe ? "_blank" : undefined,
    rel: safe ? "noopener noreferrer" : undefined
  });
  if (!safe) link.setAttribute("aria-disabled", "true");
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

  clearContent();

  if (!appData.projects?.length) {
    showStatus(loadError ? "Oyunlar şu anda yüklenemedi. Daha sonra yeniden deneyebilirsin." : isLoading ? "Oyunlar yükleniyor…" : "Henüz oyun eklenmedi.", Boolean(loadError));
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

    const detail = el("a", { className: "button", text: "Detayları Gör", href: `oyunlar.html#project/${slugify(project.title)}` });
    const open = externalButton(project.button || "Aç", project.url || "", true);
    const actions = el("div", { className: "card-actions" }, [detail, open]);
    grid.append(el("article", { className: "project-card" }, [top, description, actions]));
  });
  content.append(grid);
}

function renderProjectDetail(slug) {
  const project = appData.projects?.find(item => slugify(item.title) === slug);
  if (!project) {
    setHeading("projects", "Oyun Bulunamadı", "Aradığın proje bulunamadı.");

    showStatus("Bu proje bulunamadı veya veri kaynağından kaldırılmış olabilir.", true);
    return;
  }

  setHeading("projects", project.title || "Oyun Detayı", `${project.status || ""}${project.platform ? ` • ${project.platform}` : ""}`);

  clearContent();

  const info = el("div", {}, [
    el("h2", { text: project.title || "İsimsiz Proje" }),
    el("p", { className: "meta-line", text: `Durum: ${project.status || "Belirtilmedi"}` }),
    el("p", { className: "meta-line", text: `Platform: ${project.platform || "PC"}` })
  ]);
  const hero = el("div", { className: "detail-hero" }, [info, projectIcon(project, "detail-icon")]);
  const card = el("article", { className: "detail-card" }, [hero]);
  card.append(el("p", { className: "detail-description", text: project.description || project.short_description || "" }));

  if (Array.isArray(project.screenshots) && project.screenshots.length) {
    card.append(el("h3", { className: "section-title", text: "Ekran Görüntüleri" }));
    const shots = el("div", { className: "screenshot-grid" });
    project.screenshots.slice(0, 10).forEach((src, index) => {
      const safeSrc = safeWebUrl(src);
      if (!safeSrc) return;
      const img = el("img", { src: safeSrc, alt: `${project.title} ekran görüntüsü ${index + 1}` });
      const link = el("a", { href: safeSrc, target: "_blank", rel: "noopener noreferrer" }, [img]);
      shots.append(link);
    });
    card.append(shots);
  }

  const actions = el("div", { className: "detail-actions" });
  if (project.url) actions.append(externalButton(project.button || "Sayfayı Aç", project.url, true));
  actions.append(el("a", { className: "button", text: "← Oyunlara Geri Dön", href: "oyunlar.html" }));
  card.append(actions);
  content.append(card);
}

function renderDevlog() {
  setHeading("devlog");

  clearContent();

  if (!appData.devlog?.length) {
    showStatus(loadError ? "Geliştirme günlüğü şu anda yüklenemedi." : isLoading ? "Geliştirme günlüğü yükleniyor…" : "Henüz geliştirme notu eklenmedi.", Boolean(loadError));
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

function renderHome() {
  setHeading("home");
  clearContent();

  const aboutHeading = el("div", { className: "about-heading" }, [
    el("div", {}, [
      el("p", { className: "section-label", text: "HAKKIMDA" }),
      el("h2", { text: "Melih Çağrı Dayı" })
    ]),
    el("span", { className: "education-chip", text: "4. sınıf öğrencisi" })
  ]);

  const about = el("article", { className: "text-card home-about" }, [
    aboutHeading,
    el("p", { className: "about-lead", text: "İzmir Demokrasi Üniversitesi Elektrik-Elektronik Mühendisliği 4. sınıf öğrencisiyim." }),
    el("p", { text: "Eğitimim boyunca edindiğim analitik düşünme ve problem çözme yaklaşımını, mühendislik ve yazılım alanındaki çalışmalarımda kullanmaya odaklanıyorum. Elektronik sistemlerin çalışma prensiplerini anlamak, teorik bilgileri uygulamalı çalışmalarla pekiştirmek ve teknik becerilerimi geliştirmek benim için öncelikli." }),
    el("p", { text: "Akademik ilgi alanlarımın yanında Klovery Games adıyla Godot kullanarak bağımsız PC oyunları ve etkileşimli deneyimler geliştiriyorum. Mühendislik bakış açımı hem teknik projelerime hem de oyun geliştirme sürecine taşımayı hedefliyorum." }),
    el("div", { className: "about-tags" }, [
      el("span", { text: "Elektrik-Elektronik Mühendisliği" }),
      el("span", { text: "Uygulamalı projeler" }),
      el("span", { text: "Godot & oyun geliştirme" })
    ])
  ]);
  about.id = "hakkimda";
  content.append(about);

  const grid = el("div", { className: "home-overview-grid" });
  const addCard = (icon, title, description, linkText, href, external = false) => {
    const link = el("a", {
      className: "overview-link",
      href,
      text: linkText,
      target: external ? "_blank" : undefined,
      rel: external ? "noopener noreferrer" : undefined
    });
    grid.append(el("article", { className: "text-card overview-card" }, [
      el("span", { className: "overview-icon", text: icon }),
      el("h2", { text: title }),
      el("p", { text: description }),
      link
    ]));
  };
  addCard("🎮", "Oyunlar", "Godot ile geliştirdiğim bağımsız PC oyunlarını ve oyun detaylarını keşfet.", "Oyunları İncele ↗", "oyunlar.html");
  addCard("📁", "Mühendislik Projeleri", "Eğitimim ve bireysel çalışmalarım kapsamında hazırladığım teknik projeler.", "Projelere Git ↗", "projeler.html");
  addCard("📝", "Geliştirme Günlüğü", "Projelerdeki ilerlemeleri, güncellemeleri ve geliştirme notlarını takip et.", "Günlüğü Aç ↗", "devlog.html");
  addCard("💜", "Destek Ol", "Bağımsız oyun çalışmalarımı desteklemek istersen destek sayfama göz atabilirsin.", "Destek Sayfası ↗", "https://buymeacoffee.com/KloverY", true);
  content.append(grid);
}

function renderSchool() {
  setHeading("school");
  clearContent();
  if (!Array.isArray(window.SCHOOL_PROJECTS) || !window.SCHOOL_PROJECTS.length) {
    content.append(el("article",{className:"text-card"},[
      el("h2",{text:"Mühendislik Projeleri"}),
      el("p",{text:"Elektrik-Elektronik Mühendisliği eğitimim ve bireysel çalışmalarım kapsamında hazırladığım projeleri burada paylaşacağım. Bu bölüm şu anda hazırlanıyor."})
    ]));return;
  }
  const grid=el("div",{className:"projects-grid"});
  window.SCHOOL_PROJECTS.forEach((p,i)=>{
    const card=el("article",{className:"project-card"},[
      el("h2",{text:p.title||"Proje"}),el("p",{className:"project-description",text:p.description||""})
    ]);
    if(p.image)card.prepend(el("img",{className:"school-image",src:p.image,alt:p.title||"Proje görseli"}));
    const safeProjectUrl = safeWebUrl(p.url);
    if(safeProjectUrl)card.append(el("a",{className:"button",href:safeProjectUrl,text:"Projeyi İncele",target:"_blank",rel:"noopener noreferrer"}));
    card.append(reactionArea("school-"+(p.id||slugify(p.title)||i)));
    grid.append(card);
  });content.append(grid);
}
function reactionArea(id) {
  const wrapper=el("div",{className:"reaction-widget"});wrapper.dataset.reactionId=id;
  wrapper.append(el("p",{className:"reaction-label",text:"Bu çalışmayı nasıl buldun?"}),el("div",{className:"reaction-buttons"}),el("small",{className:"reaction-message",text:"Tepkiler Firebase bağlandıktan sonra etkinleşir."}));
  return wrapper;
}
function addGameReactions(){
  document.querySelectorAll(".project-card").forEach((card,i)=>{
    const project=appData.projects[i];if(project)card.append(reactionArea("game-"+slugify(project.title)));
  });
  const detail=document.querySelector(".detail-card");
  if(detail){const slug=location.hash.replace(/^#project\//,"");detail.append(reactionArea("game-"+slug));}
}
function renderRoute() {
  const pathname=location.pathname.split("/").pop();
  const page=pathname==="oyunlar.html"?"games":pathname==="projeler.html"?"school":pathname==="devlog.html"?"devlog":"home";
  document.querySelectorAll("[data-page]").forEach(a=>{const active=a.dataset.page===page;a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  if(page==="games"){
    const slug=location.hash.startsWith("#project/")?location.hash.slice(9):null;
    if(slug)renderProjectDetail(slug);
    else renderProjects();
    addGameReactions();
  }else if(page==="school")renderSchool();else if(page==="devlog")renderDevlog();else renderHome();
  document.querySelectorAll(".reaction-widget").forEach(node=>window.KloveryReactions?.mount(node));
  mobileNav.classList.remove("open");menuToggle.setAttribute("aria-expanded","false");
}
async function loadData() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const data = await response.json();
    appData = {
      projects: Array.isArray(data.projects) ? data.projects : [],
      devlog: Array.isArray(data.devlog) ? data.devlog : []
    };
  } catch (error) {
    console.error("Veri yükleme hatası:", error);
    loadError = error;
  } finally {
    isLoading = false;
  }
  // An external data request must not delay or reset the homepage and mobile menu.
  const pathname = location.pathname.split("/").pop();
  if (pathname === "oyunlar.html" || pathname === "devlog.html") renderRoute();
}
menuToggle.addEventListener("click",()=>{const open=mobileNav.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));});
window.addEventListener("hashchange",renderRoute);
window.addEventListener("klovery-reactions-ready",()=>document.querySelectorAll(".reaction-widget").forEach(node=>window.KloveryReactions.mount(node)));
window.addEventListener("klovery-auth-ready",()=>document.querySelectorAll(".reaction-widget").forEach(node=>window.KloveryReactions?.mount(node)));
renderRoute();
loadData();
