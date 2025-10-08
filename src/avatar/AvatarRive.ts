// src/avatar/AvatarRive.ts
import Phaser from "phaser";
import { Rive, Layout, Fit, Alignment, EventType } from "@rive-app/canvas";
import { ASSET } from "@/utils/assets";

export type AnimName =
  | "idle"
  | "run"
  | "jump"
  | "fall"
  | "jab"
  | "hurt"
  | "win";

export type AvatarConfig = {
  skinHue?: number; // 0..360   (optional)
  hairHue?: number; // 0..360
  outfitHue?: number; // 0..360
  hairIdx?: number; // 0..n
  outfitIdx?: number; // 0..n
};

export type RiveAvatar = {
  // Physics-enabled image used by scenes/colliders
  body: Phaser.Physics.Arcade.Image;
  // Drive Rive state machine by high-level names
  play: (name: AnimName, loop?: boolean) => void;
  // Update customization inputs (if present in the .riv file)
  setLook: (cfg: AvatarConfig) => void;
  // Clean everything
  destroy: () => void;
};

// ----- Tune these to match your Rive file names -----
const RIVE_SRC = ASSET("/assets/rive/avatar.riv");
const ARTBOARD = "Avatar";
const STATE_MACHINE = "AvatarSM";
// map high-level anim name -> { boolean | trigger } input on the state machine
const INPUTS = {
  Idle: "Idle",
  Run: "Run",
  Jump: "Jump",
  Fall: "Fall",
  Jab: "Jab", // trigger
  Hurt: "Hurt",
  Win: "Win",
};
const CUSTOM_INPUTS = {
  SkinHue: "SkinHue",
  HairHue: "HairHue",
  OutfitHue: "OutfitHue",
  HairIdx: "HairIdx",
  OutfitIdx: "OutfitIdx",
};
// ----------------------------------------------------

export function createPaperDollAvatar( // keep same export name to avoid refactors
  scene: Phaser.Scene,
  x: number,
  y: number,
  cfg: AvatarConfig = {}
): RiveAvatar {
  // 1) Dedicated canvas Rive draws into
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;

  // 2) Add a Phaser texture that is backed by this canvas
  //    We'll refresh it every frame so WebGL uploads the latest pixels.
  const texKey = `rive-avatar-${Phaser.Utils.String.UUID()}`;
  const canvasTex = scene.textures.addCanvas(texKey, canvas);
  const image = scene.add.image(x, y, texKey).setOrigin(0.5, 0.92); // anchor near the feet

  // 3) Physics body used by all scenes as before
  scene.physics.add.existing(image);
  const body = image.body as Phaser.Physics.Arcade.Body;
  body.setSize(28, 46).setOffset(-14, -23); // same collider as your paper-doll
  // Note: scenes can call setAllowGravity, setVelocity, etc. on this `body`

  // 4) Create Rive instance on the canvas
  const rive = new Rive({
    src: RIVE_SRC,
    canvas,
    autoplay: true,
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
    onLoad: () => {
      // make pixels crisp on HiDPI / when resized
      rive.resizeDrawingSurfaceToCanvas(); // recommended by Rive docs :contentReference[oaicite:2]{index=2}
      // initialize inputs and customization
      cacheInputs();
      applyLook(cfg);
      // default to idle
      setAnim("idle");
    },
  });

  // 5) Map of state machine inputs for quick access
  type Input = ReturnType<typeof rive.stateMachineInputs>[number];
  const inputs = new Map<string, Input>();
  function cacheInputs() {
    rive
      .stateMachineInputs(STATE_MACHINE)
      .forEach((i) => inputs.set(i.name, i));
  }

  function setBool(name: string, v: boolean) {
    const i = inputs.get(name);
    if (i && typeof i.value === "boolean") i.value = v;
  }
  function setNum(name: string, v: number) {
    const i = inputs.get(name);
    if (i && typeof i.value === "number") i.value = v;
  }
  function fire(name: string) {
    const i = inputs.get(name);
    if (i && typeof (i as any).fire === "function") (i as any).fire();
  }

  function clearMotionFlags() {
    setBool(INPUTS.Idle, false);
    setBool(INPUTS.Run, false);
    setBool(INPUTS.Jump, false);
    setBool(INPUTS.Fall, false);
    setBool(INPUTS.Hurt, false);
    setBool(INPUTS.Win, false);
  }

  function setAnim(name: AnimName) {
    clearMotionFlags();
    switch (name) {
      case "idle":
        setBool(INPUTS.Idle, true);
        break;
      case "run":
        setBool(INPUTS.Run, true);
        break;
      case "jump":
        setBool(INPUTS.Jump, true);
        break;
      case "fall":
        setBool(INPUTS.Fall, true);
        break;
      case "jab":
        fire(INPUTS.Jab);
        break; // trigger
      case "hurt":
        setBool(INPUTS.Hurt, true);
        break;
      case "win":
        setBool(INPUTS.Win, true);
        break;
    }
  }

  function applyLook(c: AvatarConfig) {
    if (c.skinHue !== undefined) setNum(CUSTOM_INPUTS.SkinHue, c.skinHue);
    if (c.hairHue !== undefined) setNum(CUSTOM_INPUTS.HairHue, c.hairHue);
    if (c.outfitHue !== undefined) setNum(CUSTOM_INPUTS.OutfitHue, c.outfitHue);
    if (c.hairIdx !== undefined) setNum(CUSTOM_INPUTS.HairIdx, c.hairIdx);
    if (c.outfitIdx !== undefined) setNum(CUSTOM_INPUTS.OutfitIdx, c.outfitIdx);
  }

  // 6) Keep Phaser texture in sync with the Rive canvas
  const refreshTex = () => {
    // As Rive renders on its own RAF, just upload the latest pixels each tick
    (canvasTex as Phaser.Textures.CanvasTexture).refresh();
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, refreshTex);

  // 7) Cleanup on destroy / scene shutdown
  const cleanup = () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, refreshTex);
    try {
      rive.cleanup?.();
    } catch {}
    image.destroy(true);
    // texture is auto-removed with image; if not, uncomment:
    // scene.textures.remove(texKey);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

  return {
    body: image as Phaser.Physics.Arcade.Image,
    play: (n: AnimName) => setAnim(n),
    setLook: (c: AvatarConfig) => applyLook(c),
    destroy: cleanup,
  };
}
