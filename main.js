// TMDB API Configuration
const API_TOKEN = "YOUR_API_TOKEN_HERE"; // Replace with your actual API token from TMDB
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
