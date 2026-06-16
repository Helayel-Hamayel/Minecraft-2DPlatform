// 1. List all your panorama images in an array
const panoramas = [
    "url('../assets/images/Panorama/pano_1.png')",
    "url('../assets/images/Panorama/pano_2.png')",
    "url('../assets/images/Panorama/pano_3.png')"
];

let currentIndex = 0;

const toggleButton = document.getElementById('bg-toggle');

toggleButton.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % panoramas.length;
    document.documentElement.style.setProperty('--current-panorama', panoramas[currentIndex]);
});

// 

const menuMusic = document.getElementById('menu-music');
const audioButton = document.getElementById('audioOnOff');

menuMusic.volume = 0.6; 

audioButton.addEventListener('click', (event) => {
    event.preventDefault(); 
   
    if (menuMusic.paused) {
        menuMusic.play();
        audioButton.style.color = "#FFF555"; 
        console.log("Music Playing");
    } else {
        menuMusic.pause();
        audioButton.style.color = ""; 
        console.log("Music Paused");
    }
});