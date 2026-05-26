const FAVORITES_STORAGE_KEY = "favourites";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const favoriteCount = document.querySelector("#favorite-count");
const emptyState = document.querySelector("#empty-state");
const journalList = document.querySelector("#journal-list");

const getFavorites = () => {
  const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);

  if (!storedFavorites) {
    return [];
  }

  try {
    const favorites = JSON.parse(storedFavorites);
    return Array.isArray(favorites) ? favorites : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
};

const getPosterUrl = (posterPath) => {
  if (!posterPath) {
    return "no-Image.png";
  }

  return `${IMAGE_BASE_URL}${posterPath}`;
};

const formatReleaseYear = (releaseDate) => {
  if (!releaseDate) {
    return "Release date unknown";
  }

  return new Date(releaseDate).getFullYear();
};

const updateMovieNote = (movieId, note) => {
  const favorites = getFavorites();
  const updatedFavorites = favorites.map((movie) => {
    if (movie.id !== movieId) {
      return movie;
    }

    return {
      ...movie,
      note,
    };
  });

  saveFavorites(updatedFavorites);
};

const removeFavorite = (movieId) => {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter((movie) => movie.id !== movieId);
  saveFavorites(updatedFavorites);
  renderJournal();
};

const createJournalCard = (movie) => {
  const card = document.createElement("article");
  card.className = "material grid gap-4 overflow-hidden bg-surface md:grid-cols-[12rem_1fr]";

  const image = document.createElement("img");
  image.src = getPosterUrl(movie.poster_path);
  image.alt = `${movie.title} poster`;
  image.className = "h-72 w-full object-cover md:h-full";

  const content = document.createElement("div");
  content.className = "grid gap-4 p-4 md:p-5";

  const headingRow = document.createElement("div");
  headingRow.className = "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between";

  const titleGroup = document.createElement("div");

  const title = document.createElement("h3");
  title.className = "text-2xl font-bold leading-tight";
  title.textContent = movie.title;

  const meta = document.createElement("p");
  meta.className = "mt-1 text-sm font-semibold text-primary";
  meta.textContent = `${formatReleaseYear(movie.release_date)} | Rating ${Number(movie.vote_average || 0).toFixed(1)}`;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "material self-start bg-gradient-secondary px-3 py-2 text-sm font-bold text-surface";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => removeFavorite(movie.id));

  const overview = document.createElement("p");
  overview.className = "text-sm leading-6 text-gray-base";
  overview.textContent = movie.overview || "No description available.";

  const noteLabel = document.createElement("label");
  noteLabel.className = "text-sm font-bold";
  noteLabel.htmlFor = `note-${movie.id}`;
  noteLabel.textContent = "Personal note";

  const noteInput = document.createElement("textarea");
  noteInput.id = `note-${movie.id}`;
  noteInput.className = "min-h-28 w-full rounded-lg border border-gray-light bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  noteInput.placeholder = "What did this movie make you think or feel?";
  noteInput.value = movie.note || "";
  noteInput.addEventListener("input", (event) => {
    updateMovieNote(movie.id, event.target.value);
  });

  titleGroup.append(title, meta);
  headingRow.append(titleGroup, removeButton);
  content.append(headingRow, overview, noteLabel, noteInput);
  card.append(image, content);

  return card;
};

function renderJournal() {
  const favorites = getFavorites();
  journalList.textContent = "";
  favoriteCount.textContent = `${favorites.length} saved ${favorites.length === 1 ? "movie" : "movies"}`;
  emptyState.classList.toggle("hidden", favorites.length > 0);

  const fragment = document.createDocumentFragment();
  favorites.forEach((movie) => {
    fragment.append(createJournalCard(movie));
  });

  journalList.append(fragment);
}

renderJournal();
