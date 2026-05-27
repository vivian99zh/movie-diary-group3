// TMDB API Configuration
const API_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiMTc1YjZhYjAxMTA2NDdjNmMxYWViYmFkYWFhMmFlYSIsIm5iZiI6MTc3OTc4MjQwNC41OTcsInN1YiI6IjZhMTU1MzA0NDI2NTVjYWRjNjA4NTgyMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ACAwtCAu5i8RCSmvId7VYDx_dEoqG5VX5K3E_ItbsrM"; // Replace with your actual API token from TMDB
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const LOAD_PAGES = 5;

// Fetch options with authorization header
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  },
};

// Grab the search input and clear button elements from the DOM
const searchInput = document.querySelector("#searchInput");
const searchClear = document.querySelector("#searchClear");

// Holds the debounce timer ID so we can cancel it on the next keystroke
let debounceTimer;

// Guard: if #searchInput doesn't exist on this page, skip everything below
if (searchInput) {
  // Fires on every keystroke, paste, or delete inside the search field
  searchInput.addEventListener("input", () => {
    // Read the current value and strip leading/trailing whitespace
    const query = searchInput.value.trim();

    // Show the clear button when there is text, hide it when the field is empty
    // toggle(className, force): adds the class if force is true, removes it if false
    searchClear.classList.toggle("hidden", query === "");

    // Cancel the previous timer so we don't fire while the user is still typing
    clearTimeout(debounceTimer);

    // Wait 300ms after the last keystroke before making the API call
    // This prevents sending a request on every single character typed
    debounceTimer = setTimeout(() => {
      if (query) {
        // User has typed something — search TMDB for matching movies
        fetchSearchResults(query);
      } else {
        // User cleared the field — wipe results and restore popular movies
        const container = document.querySelector("#moviesContainer");
        container.innerHTML = "";
        fetchAllPopularMovies(LOAD_PAGES);
      }
    }, 300);
  });

  // When the clear button (×) is clicked, reset everything back to the default state
  searchClear.addEventListener("click", () => {
    searchInput.value = "";                 // empty the input field
    searchClear.classList.add("hidden");    // hide the clear button
    const container = document.querySelector("#moviesContainer");
    container.innerHTML = "";              // remove search results from the page
    fetchAllPopularMovies(LOAD_PAGES);     // reload the popular movies
  });
}

// Fetch popular movies
fetchAllPopularMovies(LOAD_PAGES);
async function fetchAllPopularMovies(totalPages) {
  for (let page = 1; page <= totalPages; page++) {
    try {
      await fetchPopularMovies(page);
    } catch (err) {
      console.error("Error fetching movies:", err);
    }
  }
}

async function fetchPopularMovies(page) {
  try {
    const res = await fetch(
      `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`,
      options,
    );
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    displayMovies(data.results.slice(0, 12));
  } catch (err) {
    console.error("Error fetching movies:", err);
    document.querySelector("#moviesContainer").innerHTML =
      '<div class="col-span-full text-center text-error py-8"><i class="fas fa-exclamation-circle"></i> Failed to load movies. Please check your API token.</div>';
  }
}

// Display movies in container
function displayMovies(movies) {
  const container = document.querySelector("#moviesContainer");
  if (!container) return;
  container.insertAdjacentHTML("beforeend", movies.map((movie) => createMovieHtml(movie)).join(""));
}

const createMovieHtml = (movie) => {
  return `
    <div class="material bg-surface rounded-xlm overflow-hidden">
        <img class="w-full h-96 object-cover" 
             src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : "no-image.png"}" 
             alt="${movie.title}">
        <div class="p-4">
            <h3 class="font-bold text-lg text-gray-dark  mb-2 line-clamp-1">${movie.title}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-base mb-2">
                <span class="flex items-center gap-1"><i class="fas fa-star text-info"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
                <span class="flex items-center gap-1"><i class="fas fa-calendar-alt"></i> ${movie.release_date ? movie.release_date.split("-")[0] : "N/A"}</span>
            </div>
            <p class="text-gray-base text-sm mb-3 line-clamp-2">${movie.overview ? movie.overview.substring(0, 100) + "..." : "No description available."}</p>
            <button id ="addToFavouritesBtn" class="material cursor-pointer w-full bg-gradient-secondary text-surface py-2 rounded-lg  flex items-center justify-center gap-2" 
                    onclick='addToFavourites(${JSON.stringify(movie).replace(/'/g, "&#39;")})'>
                <i class="fas fa-heart"></i>
                <span>Add to Favourites</span>
            </button>
        </div>
    </div>
  `;
};

// Search TMDB for movies matching the user's query and render the results
async function fetchSearchResults(query) {
  const container = document.querySelector("#moviesContainer");
  if (!container) return;

  // Clear popular movies (or previous search results) before showing new ones
  container.innerHTML = "";

  try {
    // encodeURIComponent converts spaces and special characters into URL-safe format
    // e.g. "the dark knight" → "the%20dark%20knight"
    const res = await fetch(
      `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`,
      options,
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    // Parse the JSON response — data.results is an array of movie objects
    const data = await res.json();

    // If TMDB returned no matches, show a friendly message instead of an empty grid
    if (data.results.length === 0) {
      container.innerHTML =
        '<div class="col-span-full text-center text-gray-base py-8"><i class="fas fa-search"></i> No movies found for "<strong>' +
        query +
        '</strong>".</div>';
      return;
    }

    // Render the search results as movie cards
    displayMovies(data.results);
  } catch (err) {
    console.error("Error searching movies:", err);
  }
}

// Add movie to favourites in localStorage
function addToFavourites(movie) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || [];

  if (!favourites.some((fav) => fav.id === movie.id)) {
    favourites.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
      note: "",
    });
    localStorage.setItem("favourites", JSON.stringify(favourites));
    showNotification("Added to favourites!", "success");
  } else {
    showNotification("Movie already in favourites!", "info");
  }
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `fixed top-40 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-surface ${
    type === "success" ? "bg-success" : "bg-tertiary"
  } transition-all duration-300 animate-in slide-in-from-top`;
  notification.innerHTML = `<i class="fas ${type === "success" ? "fa-check-circle" : "fa-info-circle"} mr-2"></i>${message}`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}
