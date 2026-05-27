let moviesList = [];
let currentMovieIndex = 0;
let isVideoPlaying = false;
let carouselInterval = null;

fetchTopMovies();

async function fetchTopMovies() {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/top_rated?include_adult=false&include_video=false&language=en-US&page=1`,
      options,
    );
    const data = await res.json();
    // Get top 10 movies
    const topMovies = data.results.slice(0, 10);

    const moviePromises = topMovies.map(async (movie) => {
      const videoRes = await fetch(`${BASE_URL}/movie/${movie.id}/videos?language=en-US`, options);
      const videoData = await videoRes.json();

      const trailer = videoData.results.find((video) => video.type === "Trailer" && video.site === "YouTube");

      return {
        id: movie.id,
        title: movie.title,
        videoKey: trailer ? trailer.key : null,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        overview: movie.overview,
        rating: movie.vote_average,
      };
    });

    moviesList = await Promise.all(moviePromises);
    moviesList = moviesList.filter((movie) => movie.videoKey);

    if (moviesList.length > 0) {
      initializeCarousel();
      startCarousel();
    }
  } catch (error) {
    console.error("Error fetching videos:", error);
  }
}

function initializeCarousel() {
  const prevBtn = document.querySelector("#prevBtn");
  const nextBtn = document.querySelector("#nextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      resetCarouselInterval();
      changeMovie(currentMovieIndex - 1);
    });
    prevBtn.addEventListener("mouseleave", () => {
      playVideoOnHover(currentMovieIndex, moviesList[currentMovieIndex].videoKey);
    });
    prevBtn.addEventListener("mouseenter", () => {
      revertToImage(currentMovieIndex);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      resetCarouselInterval();
      changeMovie(currentMovieIndex + 1);
    });
    nextBtn.addEventListener("mouseleave", () => {
      playVideoOnHover(currentMovieIndex, moviesList[currentMovieIndex].videoKey);
    });
    nextBtn.addEventListener("mouseenter", () => {
      revertToImage(currentMovieIndex);
    });
  }

  renderMovieContainer(currentMovieIndex);
}

function renderMovieContainer(index) {
  const movie = moviesList[index];
  if (!movie || !movie.videoKey) return;

  const movieContainer = document.querySelector("#movieContainer");
  if (movieContainer) {
    movieContainer.style.zIndex = "10";

    // Get high-quality backdrop image
    const backdropUrl = movie.backdropPath
      ? `https://image.tmdb.org/t/p/original${movie.backdropPath}`
      : `https://image.tmdb.org/t/p/original${movie.posterPath}`;

    movieContainer.innerHTML = `
      <div class="relative w-full h-full group cursor-pointer" data-video-key="${movie.videoKey}" data-video-index="${index}">
        <!-- Background Image -->
        <img 
          src="${backdropUrl}" 
          alt="${movie.title}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        
        <!-- Dark Overlay for text readability -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <!-- Title and Overview Text - Directly on Image -->
        <div class="absolute bottom-0 left-0 right-0 p-8  md:p-12 text-surface">
          <h1 class="text-primary text-3xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg">
            ${movie.title}
          </h1>
          
          <div class="flex items-center gap-2 mb-2 md:mb-3">
            <span class="text-info font-semibold"><i class="fas fa-star text-info"></i> ${movie.rating?.toFixed(1) || "N/A"}</span>
            <span class="text-surface/60">•</span>
            <span class="text-tertiary text-sm md:text-base"><i class="fas fa-calendar-alt"></i> ${new Date().getFullYear()}</span>
          </div>
          
          <p class="text-sm md:text-base lg:text-lg text-gray-200 max-w-2xl drop-shadow-md line-clamp-2 md:line-clamp-3">
            ${movie.overview?.substring(0, 200) || ""}${movie.overview?.length > 200 ? "..." : ""}
          </p>
        </div>
      </div>
    `;

    // Add hover event listener to the hero section to play video on hover

    const heroSection = document.querySelector(".hero-section");
    if (heroSection) {
      heroSection.addEventListener("mouseenter", () => {
        playVideoOnHover(index, movie.videoKey);
      });

      heroSection.addEventListener("mouseleave", () => {
        revertToImage(index);
      });
    }
  }
}

function playVideoOnHover(index, videoKey) {
  isVideoPlaying = true;
  const movieContainer = document.querySelector("#movieContainer");
  if (!movieContainer) return;

  const currentMovie = moviesList[currentMovieIndex];
  if (!currentMovie || currentMovie.videoKey !== videoKey) return;

  movieContainer.innerHTML = `
      <div class="relative w-full h-full">
        <iframe
  src="https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&mute=1&loop=1&playlist=${videoKey}&controls=0&showinfo=0&rel=0&modestbranding=0&iv_load_policy=3&autohide=1&disablekb=1&fs=0&playsinline=1&color=surface&theme=dark&hl=en"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  class="w-full h-full object-cover pointer-events-none"
  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"
></iframe>
      </div>
    `;
}

function revertToImage(index) {
  isVideoPlaying = false;
  const movie = moviesList[index];
  if (!movie) return;
  if (currentMovieIndex !== index) return;

  setTimeout(() => {
    renderMovieContainer(index);
  }, 300);
}

function changeMovie(newIndex) {
  if (newIndex < 0) newIndex = moviesList.length - 1;
  if (newIndex >= moviesList.length) newIndex = 0;

  currentMovieIndex = newIndex;
  renderMovieContainer(currentMovieIndex);
}

function startCarousel() {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    if (!isVideoPlaying) {
      changeMovie(currentMovieIndex + 1);
    }
  }, 3000);
}

function resetCarouselInterval() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    startCarousel();
  }
}
