/**
 * state is persisted in localStorage as an array of watchlist objects.
 *
 * shape:
 *  {
 *   id: "",
 *   title: "",
 *   icon: "",
 *   items: [{
 *     id: "",
 *     title: "",
 *     posterUrl: "",
 *     watched: false,
 *     order: 0,
 *     review: ""
 *   }],
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
const dialogCreateMovieOverlay = document.getElementById(
  "dialog-create-movie-overlay",
);
const dialogCreateMovie = document.getElementById("dialog-create-movie");
const formCreateMovie = document.getElementById("form-create-movie");
const inputMoviePosterUrl = document.getElementById("input-movie-poster-url");
const inputMovieTitle = document.getElementById("input-movie-title");
const dialogReviewOverlay = document.getElementById("dialog-review-overlay");
const dialogReview = document.getElementById("dialog-review");
const formReview = document.getElementById("form-review");
const textareaReview = document.getElementById("textarea-review");
const reviewDialogTitle = document.getElementById("dialog-review-title");

// STATE //

let currentWatchlistId = null;
let currentMovieId = null;

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
function renderMovies(watchlistId) {
  const watchlists = loadWatchlists();
  const watchlist = watchlists.find((wl) => wl.id === watchlistId);
  if (!watchlist) return;

  const detailContent = document.getElementById("detail-content");
  if (watchlist.items.length === 0) {
    detailContent.innerHTML =
      '<p class="empty-state__text">No movies added yet.</p>';
    return;
  }

  detailContent.innerHTML = watchlist.items
    .sort((a, b) => a.order - b.order)
    .map(
      (movie) => `
    <article class="movie-card">
      <div class="movie-card__header">
        <img src="${escapeHTML(movie.posterUrl)}" alt="${escapeHTML(movie.title)} poster" />
        <div class="movie-card__details">
          <div class="movie-card__details-top">
            <h3 class="movie-card__title">${escapeHTML(movie.title)}</h3>
            <span class="badge badge--${movie.watched ? "watched" : "unwatched"}">
              ${movie.watched ? "Watched" : "Unwatched"}
            </span>
          </div>
          <div class="movie-card__actions">
            <button
              class="btn btn--icon btn--text btn--small"
              data-action="toggle-watched"
              data-movie-id="${movie.id}"
              aria-label="Mark as watched"
              ${movie.watched ? "disabled" : ""}>
              <ion-icon name="checkmark-circle-outline"></ion-icon>
            </button>
            <button
              class="btn btn--icon btn--text btn--small"
              data-action="${movie.review ? "edit-review" : "add-review"}"
              data-movie-id="${movie.id}"
              aria-label="${movie.review ? "Edit review" : "Add review"}">
              <ion-icon name="${movie.review ? "create-outline" : "chatbox-outline"}"></ion-icon>
            </button>
          </div>
        </div>
      </div>
      ${
        movie.review
          ? `
      <div class="movie-card__content">
        <div class="movie-card__review">
          <p class="movie-card__review-text">${escapeHTML(movie.review)}</p>
        </div>
      </div>
      `
          : ""
      }
    </article>
  `,
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
  renderMovies(watchlistId);
  dialogDetailOverlay.classList.remove("hide");
  dialogDetail.setAttribute("open", "");
}
function closeDetailDialog() {
  dialogDetailOverlay.classList.add("hide");
  dialogDetail.removeAttribute("open");
  currentWatchlistId = null;
}
function openCreateMovieDialog() {
  dialogCreateMovieOverlay.classList.remove("hide");
  dialogCreateMovie.setAttribute("open", "");
  inputMoviePosterUrl.focus();
}
function closeCreateMovieDialog() {
  dialogCreateMovieOverlay.classList.add("hide");
  dialogCreateMovie.removeAttribute("open");
  formCreateMovie.reset();
}
function openReviewDialog(movieId, existingReview = "") {
  currentMovieId = movieId;
  textareaReview.value = existingReview;
  reviewDialogTitle.textContent = existingReview ? "Edit review" : "Add review";
  dialogReviewOverlay.classList.remove("hide");
  dialogReview.setAttribute("open", "");
  textareaReview.focus();
}
function closeReviewDialog() {
  dialogReviewOverlay.classList.add("hide");
  dialogReview.removeAttribute("open");
  formReview.reset();
  currentMovieId = null;
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
dialogCreateMovieOverlay.addEventListener("click", (e) => {
  if (
    e.target === dialogCreateMovieOverlay ||
    e.target.dataset.action === "close-dialog"
  ) {
    closeCreateMovieDialog();
  }
});
dialogReviewOverlay.addEventListener("click", (e) => {
  if (
    e.target === dialogReviewOverlay ||
    e.target.dataset.action === "close-dialog"
  ) {
    closeReviewDialog();
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
  openCreateMovieDialog();
});
const detailContent = document.getElementById("detail-content");
detailContent.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const movieId = e.target.dataset.movieId;
  if (!action || !movieId) return;

  const watchlists = loadWatchlists();
  const watchlist = watchlists.find((wl) => wl.id === currentWatchlistId);
  if (!watchlist) return;

  const movie = watchlist.items.find((m) => m.id === movieId);
  if (!movie) return;

  if (action === "toggle-watched") {
    movie.watched = true;
    saveWatchlists(watchlists);
    renderMovies(currentWatchlistId);
  } else if (action === "add-review" || action === "edit-review") {
    openReviewDialog(movieId, movie.review || "");
  }
});
formReview.addEventListener("submit", (e) => {
  e.preventDefault();
  const review = textareaReview.value.trim();

  const watchlists = loadWatchlists();
  const watchlist = watchlists.find((wl) => wl.id === currentWatchlistId);
  if (!watchlist) return;

  const movie = watchlist.items.find((m) => m.id === currentMovieId);
  if (!movie) return;

  movie.review = review;
  saveWatchlists(watchlists);
  closeReviewDialog();
  renderMovies(currentWatchlistId);
});
formCreateMovie.addEventListener("submit", (e) => {
  e.preventDefault();
  const posterUrl = inputMoviePosterUrl.value.trim();
  const title = inputMovieTitle.value.trim();
  if (!posterUrl || !title) return;

  const watchlists = loadWatchlists();
  const watchlist = watchlists.find((wl) => wl.id === currentWatchlistId);
  if (!watchlist) return;

  const movie = {
    id: generateId(),
    title,
    posterUrl,
    watched: false,
    order: watchlist.items.length,
    review: "",
  };

  watchlist.items.push(movie);
  saveWatchlists(watchlists);
  closeCreateMovieDialog();
  renderMovies(currentWatchlistId);
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
