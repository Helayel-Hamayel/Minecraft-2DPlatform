const sfxBtn = document.getElementById("buttonSFX");
const sfxBtn_Out = document.getElementById("buttonSFX_Out");
sfxBtn.volume = 0.4;
sfxBtn_Out.volume = 0.4;

// Toggle different Panoramas
const panoramas = [
  "url('../assets/images/Panorama/pano_1.png')",
  "url('../assets/images/Panorama/pano_2.png')",
  "url('../assets/images/Panorama/pano_3.png')",
];

let currentIndex = 0;

const toggleButton = document.getElementById("bg-toggle");

toggleButton.addEventListener("click", () => {
  event.preventDefault();
  sfxBtn.play();

  currentIndex = (currentIndex + 1) % panoramas.length;
  document.documentElement.style.setProperty(
    "--current-panorama",
    panoramas[currentIndex],
  );
});

// Turn on and off Music
const menuMusic = document.getElementById("menu-music");
const audioButton = document.getElementById("audioOnOff");

menuMusic.volume = 0.6;

audioButton.addEventListener("click", (event) => {
  event.preventDefault();
  sfxBtn.play();

  if (menuMusic.paused) {
    menuMusic.currentTime = 0;
    menuMusic.play();
    console.log("Music Playing");
    document.documentElement.style.setProperty("--x-pos", "-29px");
  } else {
    menuMusic.pause();
    console.log("Music Paused");
    document.documentElement.style.setProperty("--x-pos", "-57px");
  }
});

menuMusic.addEventListener("ended", () => {
  menuMusic.currentTime = 0;
  menuMusic.play();
});

const tutButton = document.getElementById("showTutorialButton");
const clsTutWind = document.getElementById("closeTutWind");
const tutWind = document.querySelector(".TutorialWindow");
const stb = document.getElementById("showTutorialButton");
const sgb = document.getElementById("startGameButton");
const st = document.querySelector(".SplashText");
const mt = document.getElementById("mainTitle");

sgb.addEventListener("click", (event) => {
  event.preventDefault();
  const targetUrl = sgb.closest("a").href;

  sfxBtn.play();

  setTimeout(() => {
    window.location.href = targetUrl;
  }, 180);
});

tutButton.addEventListener("click", (event) => {
  event.preventDefault();
  sfxBtn.play();

  tutWind.style.display = "block";
  stb.style.display = "none";
  sgb.style.display = "none";
  st.style.display = "none";
  mt.style.display = "none";
});

clsTutWind.addEventListener("click", (event) => {
  event.preventDefault();
  sfxBtn_Out.play();

  tutWind.style.display = "none";
  stb.style.display = "flex";
  sgb.style.display = "flex";
  st.style.display = "block";
  mt.style.display = "flex";
});
