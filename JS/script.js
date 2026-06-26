// Setting up the SFX Values
const sfxBtn = document.getElementById("buttonSFX");
const sfxBtn_Out = document.getElementById("buttonSFX_Out");
sfxBtn.volume = 0.4;
sfxBtn_Out.volume = 0.4;

//--------------------------------------------
// ===== Background panorama in Main Menu =====
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
  playSfx(0);

  currentIndex = (currentIndex + 1) % panoramas.length;
  document.documentElement.style.setProperty(
    "--current-panorama",
    panoramas[currentIndex],
  );
});
//--------------------------------------------
// ===== Toggle Song on/off in Main Menu =====
const menuMusic = document.getElementById("menu-music");
const audioButton = document.getElementById("audioOnOff");

menuMusic.volume = 0.6;

audioButton.addEventListener("click", (event) => {
  event.preventDefault();
  playSfx(0);

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

//--------------------------------------------
// ===== Buttons: SFX interactivity, hiding them when showing tutorial menu =====
const splashText = document.querySelector(".SplashText");
const tutorialWindow = document.querySelector(".TutorialWindow");

const showTutorialButton = document.getElementById("showTutorialButton");
const closeTutorialButton = document.getElementById("closeTutWind");
const startGameButton = document.getElementById("startGameButton");
const mainTitle = document.getElementById("mainTitle");

//--------------------------------------------
// when clicking on Start game it would cut off the SFX_Click abrubtly.
// so i put the settimeout lenght exactly as SFX_Click (with bit of room to breath)
startGameButton.addEventListener("click", (event) => {
  event.preventDefault();
  const targetUrl = startGameButton.closest("a").href;
  playSfx(0);

  setTimeout(() => {
    window.location.href = targetUrl;
  }, 180);
});

//--------------------------------------------
// the purpose is to hide the UI Elements that will block the Tutorial window so i decided to hide them
// and make them appear again when user exits the Tutorial window
showTutorialButton.addEventListener("click", (event) => {
  event.preventDefault();
  playSfx(0);

  tutorialWindow.style.display = "block";
  showTutorialButton.style.display = "none";
  startGameButton.style.display = "none";
  splashText.style.display = "none";
  mainTitle.style.display = "none";
});

closeTutorialButton.addEventListener("click", (event) => {
  event.preventDefault();
  playSfx(1);

  tutorialWindow.style.display = "none";
  showTutorialButton.style.display = "flex";
  startGameButton.style.display = "flex";
  splashText.style.display = "block";
  mainTitle.style.display = "flex";
});

function playSfx(special) {
  switch (special) {
    case 0:
      sfxBtn.currentTime = 0; 
      sfxBtn.play();
      break;
    case 1:
      sfxBtn_Out.currentTime = 0; 
      sfxBtn_Out.play();
      break;

    default:
      break;
  }
}

