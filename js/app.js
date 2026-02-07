/**
 * ARCHITECTURE:
 * - State is persisted in localStorage as an array of watchlist objects
 * - Each watchlist contains an array of movie items
 * - UI updates reactively by re-rendering from localStorage state
 * - Event delegation used for dynamically generated movie cards
 *
 * DATA STRUCTURE:
 * watchlists = [{
 *   id: "uuid",
 *   title: "string",
 *   icon: "emoji",
 *   items: [{
 *     id: "uuid",
 *     title: "string",
 *     posterUrl: "string",
 *     watched: boolean,
 *     order: number,
 *     review: "string"
 *   }]
 * }]
 *
 * @version 1.0.0
 */

// CONSTANTS //

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

// STATE MANAGEMENT //

let currentWatchlistId = null;
let currentMovieId = null;
let lastFocusedElement = null; // track focus for accessibility

// UTILITY FUNCTIONS //

function loadWatchlists() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return data;
  } catch {
    console.warn("Failed to load watchlists from localStorage");
    return [];
  }
}

function saveWatchlists(watchlists) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
  } catch (error) {
    // handle quota exceeded or private browsing mode
    console.error("Failed to save watchlists:", error);
    alert("Unable to save changes. Your storage may be full.");
  }
}

function generateId() {
  return crypto.randomUUID();
}

/**
 * Validate poster URL to prevent XSS attacks
 * Only allow http and https protocols
 */
function validatePosterUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Escape HTML to prevent XSS in user-provided content
 * Used for text content only - URLs are validated separately
 */
function escapeHTML(str) {
  const el = document.createElement("span");
  el.textContent = str;
  return el.innerHTML;
}

/**
 * Find watchlist by ID - used frequently across event handlers
 */
function getWatchlistById(id) {
  const watchlists = loadWatchlists();
  return watchlists.find((wl) => wl.id === id);
}

// RENDERING FUNCTIONS //

function renderApp() {
  const watchlists = loadWatchlists();
  const hasWatchlists = watchlists.length > 0;

  // toggle empty state UI based on whether we have any watchlists
  body.classList.toggle("states-empty", !hasWatchlists);
  mainContent.classList.toggle("container--empty", !hasWatchlists);
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
    <article class="watchlist-card card-base" data-id="${wl.id}">
      <header class="watchlist-card__header">
        <span class="watchlist-card__icon" aria-hidden="true">${wl.icon}</span>
        <h2 class="watchlist-card__title">${escapeHTML(wl.title)}</h2>
      </header>
      <p class="watchlist-card__count">${wl.items.length} items</p>
    </article>`,
    )
    .join("");
}
/**
 * Render movies for a specific watchlist
 * Handles empty state and delegates to buildMovieCardHTML for each item
 */
function renderMovies(watchlistId) {
  const watchlist = getWatchlistById(watchlistId);
  if (!watchlist) return;

  const detailContent = document.getElementById("detail-content");

  if (watchlist.items.length === 0) {
    detailContent.innerHTML =
      '<p class="empty-state__text">No movies added yet.</p>';
    return;
  }

  // sort by order property (with fallback for data integrity)
  const sortedMovies = watchlist.items.sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  detailContent.innerHTML = sortedMovies.map(buildMovieCardHTML).join("");
}

/**
 * Build HTML for a single movie card
 * Extracted for readability and maintainability
 */
function buildMovieCardHTML(movie) {
  const badgeClass = movie.watched ? "watched" : "unwatched";
  const badgeText = movie.watched ? "Watched" : "Unwatched";
  const watchedBtnDisabled = movie.watched ? "disabled" : "";
  const reviewAction = movie.review ? "edit-review" : "add-review";
  const reviewLabel = movie.review ? "Edit review" : "Add review";
  const reviewIcon = movie.review ? "create-outline" : "chatbox-outline";

  return `
    <article class="movie-card card-base">
      <div class="movie-card__header">
        <img 
          src="${escapeHTML(movie.posterUrl)}" 
          alt="${escapeHTML(movie.title)} poster" />
        <div class="movie-card__details">
          <div class="movie-card__details-top">
            <h3 class="movie-card__title">${escapeHTML(movie.title)}</h3>
            <span class="badge badge--${badgeClass}">
              ${badgeText}
            </span>
          </div>
          <div class="movie-card__actions">
            <button
              class="btn btn--icon btn--text btn--small"
              data-action="toggle-watched"
              data-movie-id="${movie.id}"
              aria-label="Mark ${escapeHTML(movie.title)} as watched"
              ${watchedBtnDisabled}>
              <ion-icon name="checkmark-circle-outline"></ion-icon>
            </button>
            <button
              class="btn btn--icon btn--text btn--small"
              data-action="${reviewAction}"
              data-movie-id="${movie.id}"
              aria-label="${reviewLabel} for ${escapeHTML(movie.title)}">
              <ion-icon name="${reviewIcon}"></ion-icon>
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
  `;
}

// DIALOG MANAGEMENT //

/**
 * Generic modal opening function
 * Stores last focused element for accessibility
 */
function openModal(overlayEl, dialogEl, focusEl) {
  lastFocusedElement = document.activeElement;
  overlayEl.classList.remove("hide");
  dialogEl.setAttribute("open", "");
  if (focusEl) focusEl.focus();
}

/**
 * Generic modal closing function
 * Restores focus to trigger element for accessibility
 */
function closeModal(overlayEl, dialogEl, formEl) {
  overlayEl.classList.add("hide");
  dialogEl.removeAttribute("open");
  if (formEl) formEl.reset();
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

/**
 * Create reusable overlay click handler
 * Closes dialog when clicking outside or on close button
 */
function createOverlayClickHandler(overlayEl, closeFunction) {
  return (e) => {
    if (e.target === overlayEl || e.target.dataset.action === "close-dialog") {
      closeFunction();
    }
  };
}

/**
 * Create reusable Escape key handler for dialog accessibility
 */
function createEscapeKeyHandler(closeFunction) {
  return (e) => {
    if (e.key === "Escape") {
      closeFunction();
    }
  };
}

// specific dialog functions (thin wrappers for clarity)

function openDialog() {
  openModal(dialogOverlay, dialogCreate, inputTitle);
}

function closeDialog() {
  closeModal(dialogOverlay, dialogCreate, formCreate);
}

function openDetailDialog(watchlistId) {
  const watchlist = getWatchlistById(watchlistId);
  if (!watchlist) return;

  currentWatchlistId = watchlistId;
  detailWatchlistTitle.textContent = watchlist.title;
  renderMovies(watchlistId);
  openModal(dialogDetailOverlay, dialogDetail, null);
}

function closeDetailDialog() {
  closeModal(dialogDetailOverlay, dialogDetail, null);
  currentWatchlistId = null;
}

function openCreateMovieDialog() {
  openModal(dialogCreateMovieOverlay, dialogCreateMovie, inputMoviePosterUrl);
}

function closeCreateMovieDialog() {
  closeModal(dialogCreateMovieOverlay, dialogCreateMovie, formCreateMovie);
}

function openReviewDialog(movieId, existingReview = "") {
  currentMovieId = movieId;
  textareaReview.value = existingReview;
  reviewDialogTitle.textContent = existingReview ? "Edit review" : "Add review";
  openModal(dialogReviewOverlay, dialogReview, textareaReview);
}

function closeReviewDialog() {
  closeModal(dialogReviewOverlay, dialogReview, formReview);
  currentMovieId = null;
}

// EVENT LISTENERS //

// fab button
fab.addEventListener("click", openDialog);

// dialog overlay click handlers (consolidated with helper function)
dialogOverlay.addEventListener(
  "click",
  createOverlayClickHandler(dialogOverlay, closeDialog),
);
dialogDetailOverlay.addEventListener(
  "click",
  createOverlayClickHandler(dialogDetailOverlay, closeDetailDialog),
);
dialogCreateMovieOverlay.addEventListener(
  "click",
  createOverlayClickHandler(dialogCreateMovieOverlay, closeCreateMovieDialog),
);
dialogReviewOverlay.addEventListener(
  "click",
  createOverlayClickHandler(dialogReviewOverlay, closeReviewDialog),
);

// escape key handlers for accessibility
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  // close dialogs in reverse stacking order (nested first)
  if (!dialogReviewOverlay.classList.contains("hide")) {
    closeReviewDialog();
  } else if (!dialogCreateMovieOverlay.classList.contains("hide")) {
    closeCreateMovieDialog();
  } else if (!dialogDetailOverlay.classList.contains("hide")) {
    closeDetailDialog();
  } else if (!dialogOverlay.classList.contains("hide")) {
    closeDialog();
  }
});

// watchlist card clicks (event delegation for dynamically generated content)
contentGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".watchlist-card");
  if (card) {
    const watchlistId = card.dataset.id;
    openDetailDialog(watchlistId);
  }
});

// add movie button
btnAddMovie.addEventListener("click", () => {
  openCreateMovieDialog();
});

// movie card action buttons (event delegation for dynamically generated content)
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

// form submit handlers

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

  // validate URL to prevent XSS via javascript: protocol
  if (!validatePosterUrl(posterUrl)) {
    alert("Please enter a valid http or https URL for the poster.");
    return;
  }

  const watchlists = loadWatchlists();
  const watchlist = watchlists.find((wl) => wl.id === currentWatchlistId);
  if (!watchlist) return;

  const movie = {
    id: generateId(),
    title,
    posterUrl,
    watched: false,
    order: watchlist.items.length, // maintain insertion order
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

// APP INITIALIZATION //

renderApp();
