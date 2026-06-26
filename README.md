# Minecraft 2D Platformer

A lightweight, browser-based 2D recreation of Minecraft built from scratch using HTML5 Canvas, CSS, and vanilla JavaScript. This project translates the core mechanics of the classic open-world voxel game into a scrolling 2D platformer environment.

---

## 🚀 Key Features

* **Procedural Sine-Wave Generation:** Builds a dynamic layout using a math-driven surface map (`12 + Math.sin(col * 0.1) * 3`). Features a dedicated water basin embedded directly between columns 15 and 20, stone stratum layered with random resource distributions (Coal, Iron, and deep Diamond nodes), and procedural Oak Tree generation.
* **Pixel-Smooth Performance Modes:** Includes a built-in culling routine that limits processing exclusively to chunks visible inside the running viewport coordinates. Pressing the `L` hotkey instantly activates a high-performance **Solid Box Render Engine**, swapping out high-resolution external PNG paths for hardware-friendly static color hex codes.
* **Reach-Enforced Interaction Limits:** Utilizes a pixel-precise coordinate mapping bridge to match absolute screen events (`clientX`/`clientY`) against canvas bounds (`getBoundingClientRect()`). Blocks can only be targeted if the absolute distance ($\Delta x, \Delta y$) from the player center satisfies the condition:
  $$\sqrt{\Delta x^2 + \Delta y^2} \le 112\text{ pixels } (3.5\text{ blocks})$$
* **Dynamic Hotbar State & Tool Requirements:** Features an interactive 9-slot structural hotbar tracking stack values, tool IDs (`pickaxe`, `shovel`, `axe`), and world block overrides. Striking objects triggers a strict validation process: harvesting Stone or Ore requires a Pickaxe, Dirt requires a Shovel, and Oak Logs require an Axe. Misaligned combinations instantly cancel breaking speed.
* **Voxel Break Progress Mechanics:** Simulates a visual structural fracture system. Holding Left Click steps up custom vector overlays across three distinct cracking phases ($>15\%$, $>45\%$, and $>75\%$). Letting go of the mouse button instantly purges the tracking states, clearing out surface fatigue.
* **Granular Gravity & Drop-Through Physics:** Runs on a coordinate validation loop. Solid block blocks apply rigid collision stopbacks against player movement speeds ($V_x = 3$, Gravity = $0.3$, Jump Force = $-9$). Passing over semi-solid layers (Leaves and Wood platforms) blocks falling paths *unless* a dedicated down-crouch modifier is held.
* **Audio Track Manager:** Employs an index-driven switching pipeline tracking a global sequence array (`[Muted]`, `Sweden`, `Alpha`). Clicking the soundboard interface cycles structural asset streams in real-time, matching updated string states dynamically to active component views.

---

## 📸 Visual Demonstration

### Main Title 
The entry dashboard parses user-defined constraints before initializing the engine loop. It provides interactive dropdown configurations for custom height/width vectors and handles primary biome initialization:

![Main Game Menu](assets/images/readmePictures/main.png)


### Custom Setup & Biome Selection
Choose your generation biome and set custom map constraints directly from the customized bottom interface panel:

![Biome Selection Screen](assets/images/readmePictures/BiomeSelection.png)

### Game Play & Mining Mechanics
Mine and build elements safely inside a precision-calculated interaction boundary centered around the player asset:

![Gameplay Mechanics](assets/images/readmePictures/Gameplay.png)

---

## 🎮 Controls

| Action / Shortcut | Input Source | Technical System Behavior |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `Left` / `Right Arrow` | Adjusts velocity $V_x$ by $\pm 3$ pixels per frame; applies rigid edge corrections. |
| **Jump** | `Spacebar` / `W` / `Up Arrow` | Applies a jump force vector of `-9` if grounded. Enforces a **450ms movement cooldown** filter. |
| **Crouch / Drop-Through** | `S` / `Down Arrow` | Activates crouching flag. Allows the player to drop through semi-solid **Wood** and **Leaves** blocks. |
| **Mine Voxel Element** | `Left Click` | Increments fracture progress by $+2.5\%$ per frame if valid tool condition is met. |
| **Place Selected Item** | `Right Click` | Drops active block type onto target `AIR` coordinates. Block validation ensures no overlap with player boundaries. |
| **Hotbar Selection** | Keys `1` through `9` | Changes active array index data, shifting visual selection overlay box by $20\text{px}$ jumps. |
| **Solid/Texture Toggle** | `L` Key | Switches performance graphics between high-fidelity `.png` assets and low-lag flat colors. |
| **Pause Game Menu** | `Escape` | Toggles loop cycle update freeze and alters underlying container CSS styles. |

---