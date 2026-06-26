// Setting up the SFX Values
const sfxBtn = document.getElementById("buttonSFX");
sfxBtn.volume = 0.4;

//--------------------------------------------
// delay switching to page enough time for the sfx to end
document.querySelectorAll('.PageChange').forEach((item, index) => {
    item.addEventListener('click', () => {
        if (index === 0) {
            delayAndPlay(0, "index.html");
        } else if (index === 1) {
            delayAndPlay(0, "game.html");
        }
    });
});

function delayAndPlay(sfxId, path) {
    event.preventDefault();
    playSfx(sfxId);

    setTimeout(() => {
        window.location.href = path;
    }, 180);
}

document.querySelectorAll('.level-item').forEach(item => {
    item.addEventListener('click', () => {
        playSfx(0);
    });
});

function playSfx(special) {
  switch (special) {
    case 0:
      sfxBtn.currentTime = 0;  
      sfxBtn.play();
      break;

    default:
      break;
  }
}

// Pass the values of height and width to game.html
document.getElementById("playTheGame").addEventListener("click", (e) => {
    e.preventDefault();

    const selectedLevel = document.querySelector('input[name="level_select"]:checked').value;
    const width = document.getElementById("worldWidth").value;
    const height = document.getElementById("worldHeight").value;
    window.location.href = `game.html?biome=${selectedLevel}&width=${width}&height=${height}`;
});