/**
 * state is persisted in localStorage as an array of watchlist objects.
 *
 * shape:
 *  {
 *   id: "",
 *   title: "",
 *   icon: "",
 *   items: [],
 *  }
 */
const STORAGE_KEY = "watchlistplus";

// DOM ELEMENTS //

const body = document.body;
const mainContent = document.getElementById("main-content");
const emptyState = document.getElementById("empty-state");
const contentGrid = document.getElementById("content-grid");
const fab = document.getElementById("fab-create");
const dialogOverlay = document.getElementById("dialog-overlay");
const dialogCreate = document.getElementById("dialog-create");
const formCreate = document.getElementById("form-create-watchlist");
const inputTitle = document.getElementById("input-watchlist-title");
const dialogDetailOverlay = document.getElementById("dialog-detail-overlay");
const dialogDetail = document.getElementById("dialog-detail");
const detailWatchlistTitle = document.getElementById("detail-watchlist-title");
const btnAddMovie = document.getElementById("btn-add-movie");

// STATE //

let currentWatchlistId = null;

// STATE HELPERS //

function loadWatchlists() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveWatchlists(watchlists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
}
function generateId() {
  return crypto.randomUUID();
}

// RENDERING //

function renderApp() {
  const watchlists = loadWatchlists();
  const hasWatchlists = watchlists.length > 0;

  // toggle states-empty & container--empty classes based on whether we have watchlists or not
  body.classList.toggle("states-empty", !hasWatchlists);
  mainContent.classList.toggle("container--empty", !hasWatchlists);
  // hide contentGrid is no watchlists & hide emptyState if we have watchlists
  emptyState.classList.toggle("hide", hasWatchlists);
  contentGrid.classList.toggle("hide", !hasWatchlists);

  if (hasWatchlists) {
    renderWatchlistCards(watchlists);
  }
}
function renderWatchlistCards(watchlists) {
  contentGrid.innerHTML = watchlists
    .map(
      (wl) => `
    <article class="watchlist-card" data-id="${wl.id}">
      <header class="watchlist-card__header">
        <span class="watchlist-card__icon" aria-hidden="true">${wl.icon}</span>
        <h2 class="watchlist-card__title">${escapeHTML(wl.title)}</h2>
      </header>
      <p class="watchlist-card__count">${wl.items.length} items</p>
    </article>`,
    )
    .join("");
}
// prevent XSS for user provided content
function escapeHTML(str) {
  const el = document.createElement("span");
  el.textContent = str;
  return el.innerHTML;
}

// DIALOG MANAGEMENT //

function openDialog() {
  dialogOverlay.classList.remove("hide");
  dialogCreate.setAttribute("open", "");
  inputTitle.focus();
}
function closeDialog() {
  dialogOverlay.classList.add("hide");
  dialogCreate.removeAttribute("open");
  formCreate.reset();
}
function openDetailDialog(watchlistId) {
  const watchlists = loadWatchlists();
  const watchlist = watchlists.find((wl) => wl.id === watchlistId);
  if (!watchlist) return;

  currentWatchlistId = watchlistId;
  detailWatchlistTitle.textContent = watchlist.title;
  dialogDetailOverlay.classList.remove("hide");
  dialogDetail.setAttribute("open", "");
}
function closeDetailDialog() {
  dialogDetailOverlay.classList.add("hide");
  dialogDetail.removeAttribute("open");
  currentWatchlistId = null;
}

// EVENT LISTENERS //

fab.addEventListener("click", openDialog);

dialogOverlay.addEventListener("click", (e) => {
  if (
    e.target === dialogOverlay ||
    e.target.dataset.action === "close-dialog"
  ) {
    closeDialog();
  }
});

dialogDetailOverlay.addEventListener("click", (e) => {
  if (
    e.target === dialogDetailOverlay ||
    e.target.dataset.action === "close-dialog"
  ) {
    closeDetailDialog();
  }
});

contentGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".watchlist-card");
  if (card) {
    const watchlistId = card.dataset.id;
    openDetailDialog(watchlistId);
  }
});

btnAddMovie.addEventListener("click", () => {
  console.log("Add movie button clicked for watchlist:", currentWatchlistId);
});
formCreate.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = inputTitle.value.trim();
  if (!title) return;

  const watchlists = loadWatchlists();
  // only 1 watchlist emoji for now
  const icons = ["🍿"];
  const icon = icons[watchlists.length % icons.length];

  watchlists.push({
    id: generateId(),
    title,
    icon,
    items: [],
  });

  saveWatchlists(watchlists);
  closeDialog();
  renderApp();
});

// INIT APP //

renderApp();
