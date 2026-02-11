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
 * VERSIONING:
 * - MAJOR: Increments when I feel enough has changed
 * - MINOR: Increments when new features are added
 * - PATCH: Increments when bugs are fixed or small improvements are made
 *
 * @version 1.1.0
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
const dialogImportOverlay = document.getElementById("dialog-import-overlay");
const dialogImport = document.getElementById("dialog-import");
const formImport = document.getElementById("form-import");
const textareaImport = document.getElementById("textarea-import");
const btnImport = document.querySelector(".site-header .btn--icon");

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

// SHARING FUNCTIONALITY //

/**
 * Handle sharing a watchlist
 * Creates shareable JSON and copies to clipboard
 */
function handleShareWatchlist(watchlistId) {
  const watchlist = getWatchlistById(watchlistId);
  if (!watchlist) return;

  const shareableData = createShareableWatchlist(watchlist);
  const jsonString = JSON.stringify(shareableData, null, 2);

  // copy to clipboard
  navigator.clipboard
    .writeText(jsonString)
    .then(() => {
      // provide user feedback
      alert(
        `"${watchlist.title}" copied to clipboard!\n\nShare this with others to import the watchlist.`,
      );
    })
    .catch((err) => {
      console.error("Failed to copy to clipboard:", err);
      // fallback: show the JSON in a dialog or prompt
      alert(
        "Unable to copy automatically. Here's your shareable watchlist:\n\n" +
          jsonString,
      );
    });
}

/**
 * Create a shareable copy of a watchlist
 * Resets all movies to unwatched state and removes reviews
 */
function createShareableWatchlist(watchlist) {
  if (!watchlist) return null;

  return {
    id: generateId(), // generate new ID for imported copy
    title: watchlist.title,
    icon: watchlist.icon,
    items: watchlist.items.map((movie, index) => ({
      id: generateId(), // generate new ID for each movie
      title: movie.title,
      posterUrl: movie.posterUrl,
      watched: false, // reset to unwatched
      order: index, // maintain order
      review: "", // remove review
    })),
  };
}

/**
 * Validate imported watchlist data
 * Ensures data structure matches expected format
 */
function validateImportedWatchlist(data) {
  if (!data || typeof data !== "object") return false;
  if (typeof data.title !== "string" || !data.title.trim()) return false;
  if (typeof data.icon !== "string") return false;
  if (!Array.isArray(data.items)) return false;

  // validate each movie item
  return data.items.every((item) => {
    return (
      item &&
      typeof item.title === "string" &&
      item.title.trim() &&
      typeof item.posterUrl === "string" &&
      validatePosterUrl(item.posterUrl) &&
      typeof item.watched === "boolean" &&
      typeof item.order === "number"
    );
  });
}

/**
 * Import a watchlist from JSON data
 * Reuses createShareableWatchlist to ensure new IDs
 */
function importWatchlist(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!validateImportedWatchlist(data)) {
      alert(
        "Invalid watchlist data. Please make sure you copied the entire text.",
      );
      return false;
    }

    const watchlists = loadWatchlists();

    // check for duplicate titles (optional - help prevent confusion)
    const duplicateTitle = watchlists.find(
      (wl) => wl.title.toLowerCase() === data.title.toLowerCase(),
    );

    let importData = data;

    if (duplicateTitle) {
      // add "(Shared with me)" suffix to distinguish
      importData = {
        ...data,
        title: `${data.title} (Shared with me)`,
      };
    }

    // ensure fresh IDs using the existing utility
    const newWatchlist = createShareableWatchlist(importData);

    watchlists.push(newWatchlist);
    saveWatchlists(watchlists);

    return true;
  } catch (error) {
    console.error("Import failed:", error);
    alert(
      "Could not import watchlist. Please make sure you pasted the correct text.",
    );
    return false;
  }
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
      <div class="watchlist-card__controls">
        <p class="watchlist-card__count">${wl.items.length} items</p>
        <button 
          class="btn btn--icon btn--text btn--small"
          data-action="share-watchlist"
          data-watchlist-id="${wl.id}"
          aria-label="Share ${escapeHTML(wl.title)}">
          <ion-icon name="share-social-outline"></ion-icon>
        </button>
      </div>
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
  renderWatchlistCards(loadWatchlists()); // re-render to update counts on watchlist cards. performance impact is negligible
}

function openCreateMovieDialog() {
  openModal(dialogCreateMovieOverlay, dialogCreateMovie, inputMovieTitle);
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

function openImportDialog() {
  openModal(dialogImportOverlay, dialogImport, textareaImport);
}

function closeImportDialog() {
  closeModal(dialogImportOverlay, dialogImport, formImport);
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
dialogImportOverlay.addEventListener(
  "click",
  createOverlayClickHandler(dialogImportOverlay, closeImportDialog),
);

// escape key handlers for accessibility
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  // close dialogs in reverse stacking order (nested first)
  if (!dialogReviewOverlay.classList.contains("hide")) {
    closeReviewDialog();
  } else if (!dialogCreateMovieOverlay.classList.contains("hide")) {
    closeCreateMovieDialog();
  } else if (!dialogImportOverlay.classList.contains("hide")) {
    closeImportDialog();
  } else if (!dialogDetailOverlay.classList.contains("hide")) {
    closeDetailDialog();
  } else if (!dialogOverlay.classList.contains("hide")) {
    closeDialog();
  }
});

// watchlist card clicks (event delegation for dynamically generated content)
contentGrid.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const watchlistId = e.target.dataset.watchlistId;

  // handle share button
  if (action === "share-watchlist" && watchlistId) {
    e.stopPropagation(); // prevent card click from opening detail view
    handleShareWatchlist(watchlistId);
    return;
  }

  // handle card click to open detail view
  const card = e.target.closest(".watchlist-card");
  if (card) {
    const id = card.dataset.id;
    openDetailDialog(id);
  }
});

// add movie button
btnAddMovie.addEventListener("click", () => {
  openCreateMovieDialog();
});

// import button in header
btnImport.addEventListener("click", openImportDialog);

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

formImport.addEventListener("submit", (e) => {
  e.preventDefault();
  const importData = textareaImport.value.trim();

  if (!importData) return;

  const success = importWatchlist(importData);

  if (success) {
    closeImportDialog();
    renderApp();
    alert("Watchlist imported successfully!");
  }
});

// APP INITIALIZATION //

renderApp();
