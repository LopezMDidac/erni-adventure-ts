// src/avatar/RiveAvatarOverlay.ts
import Phaser from "phaser";
import { Rive, Layout, Fit, Alignment, decodeImage } from "@rive-app/canvas";
import { ASSET } from "@/utils/assets";

const HEADS = [
  ASSET("/assets/avatar/heads/head_00.png"),
  ASSET("/assets/avatar/heads/head_01.png"),
  ASSET("/assets/avatar/heads/head_02.png"),
  ASSET("/assets/avatar/heads/head_03.png"),
  ASSET("/assets/avatar/heads/head_04.png"),
  ASSET("/assets/avatar/heads/head_05.png"),
];
const TORSOS = [
  ASSET("/assets/avatar/torsos/torso_00.png"),
  ASSET("/assets/avatar/torsos/torso_01.png"),
  ASSET("/assets/avatar/torsos/torso_02.png"),
  ASSET("/assets/avatar/torsos/torso_00.png"),
  ASSET("/assets/avatar/torsos/torso_01.png"),
  ASSET("/assets/avatar/torsos/torso_02.png"),
];
export type AnimName =
  | "idle"
  | "hi"
  | "run"
  | "jump"
  | "fall"
  | "jab"
  | "hurt"
  | "win";

// Match to the authored Image node pixel sizes in your Rive file
const EXPECTED_IMAGE_SIZE: Record<string, { w: number; h: number }> = {
  HeadImage: { w: 170, h: 170 },
  TorsoImage: { w: 460, h: 730 },
};

type CreateOpts = {
  x: number;
  y: number;
  cssWidth?: number;
  cssHeight?: number;
  src?: string;
  artboard?: string;
  stateMachine?: string;
  viewModelName?: string; // defaults to "AvatarVM"
  onReady?: () => void;
  onError?: (e: unknown) => void;
};

export function createRiveAvatarOverlay(
  scene: Phaser.Scene,
  {
    x,
    y,
    cssWidth = 260,
    cssHeight = 260,
    src = ASSET("/assets/rive/avatar.riv"),
    artboard = "Avatar",
    stateMachine = "AvatarSM",
    viewModelName = "AvatarVM",
    onReady,
    onError,
  }: CreateOpts
) {
  const dpr = 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
  canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.style.pointerEvents = "none";
  canvas.style.background = "transparent";

  const dom = scene.add.dom(x, y, canvas).setDepth(1000);

  let rive: Rive | null = null;
  let inputsCache: ReturnType<Rive["stateMachineInputs"]> | undefined;
  let vmi: any | null = null;

  try {
    rive = new Rive({
      src,
      canvas,
      autoplay: true,
      artboard,
      stateMachines: stateMachine,
      autoBind: true, // try auto-bind first (requires artboard default VM in the .riv)
      layout: new Layout({ fit: Fit.Fill, alignment: Alignment.TopLeft }),
      onLoad: () => {
        rive!.resizeDrawingSurfaceToCanvas();

        // Fallback manual bind if autoBind didn't attach a view model instance
        vmi = (rive as any).viewModelInstance;
        if (!vmi) {
          const vm = rive!.viewModelByName(viewModelName);
          if (vm) {
            vmi = vm.defaultInstance();
            rive!.bindViewModelInstance(vmi);
          }
        }

        // Cache inputs for quicker toggling
        try {
          inputsCache = rive!.stateMachineInputs(stateMachine);
        } catch {}

        onReady?.();
      },
    });
  } catch (e) {
    onError?.(e);
  }

  // ---- Anim control --------------------------------------------------------
  const setBool = (name: string, val: boolean) => {
    if (!rive) return;
    const inputs = inputsCache ?? rive.stateMachineInputs(stateMachine);
    const i = inputs.find((x: any) => x.name === name);
    if (i && typeof i.value === "boolean") (i as any).value = val;
  };
  const fire = (name: string) => {
    if (!rive) return;
    const inputs = inputsCache ?? rive.stateMachineInputs(stateMachine);
    const i = inputs.find((x: any) => x.name === name);
    if (i && typeof (i as any).fire === "function") (i as any).fire();
  };

  function play(name: AnimName) {
    ["Idle", "Run", "Jump", "Fall", "Hurt", "Win"].forEach((k) =>
      setBool(k, false)
    );
    if (name === "idle") setBool("Idle", true);
    else if (name === "run") setBool("Run", true);
    else if (name === "jump") setBool("Jump", true);
    else if (name === "fall") setBool("Fall", true);
    else if (name === "hurt") setBool("Hurt", true);
    else if (name === "win") setBool("Win", true);
    else if (name === "jab") fire("Jab");
    else if (name === "hi") fire("Hi");
  }

  // ---- Texture swapping with auto-resize ----------------------------------
  async function setImage(propertyName: string, idx: number) {
    if (!rive) return;
    vmi = (rive as any).viewModelInstance ?? vmi;
    if (!vmi) return;

    const prop = vmi.image?.(propertyName);
    if (!prop) return;

    let url: string;
    if (propertyName === "HeadImage") {
      url = HEADS[idx % HEADS.length];
    } else if (propertyName === "TorsoImage") {
      url = TORSOS[idx % TORSOS.length];
    } else {
      return;
    }
    const res = await fetch(url);
    if (!res.ok) return;

    const blob = await res.blob();
    let bytes: Uint8Array;

    try {
      const bmp = await createImageBitmap(blob);
      const target = EXPECTED_IMAGE_SIZE[propertyName] || {
        w: bmp.width,
        h: bmp.height,
      };

      if (bmp.width !== target.w || bmp.height !== target.h) {
        const off = document.createElement("canvas");
        off.width = target.w;
        off.height = target.h;
        const ctx = off.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, target.w, target.h);
        ctx.drawImage(bmp, 0, 0, target.w, target.h);
        const scaled = await new Promise<Blob>((resolve) =>
          off.toBlob((b) => resolve(b as Blob), "image/png")
        );
        bytes = new Uint8Array(await scaled.arrayBuffer());
      } else {
        bytes = new Uint8Array(await blob.arrayBuffer());
      }
    } catch {
      // Fallback if createImageBitmap is unavailable
      bytes = new Uint8Array(await blob.arrayBuffer());
    }

    const decoded = await decodeImage(bytes);
    if (!decoded) return;
    prop.value = decoded;
    decoded.unref?.();
  }

  // ---- Utilities -----------------------------------------------------------
  function setPosition(nx: number, ny: number) {
    dom.setPosition(nx, ny);
  }
  function setZoom(factor: number) {
    // const f = Math.max(0.01, factor);
    // const w = Math.max(1, Math.floor(cssWidth * f));
    // const h = Math.max(1, Math.floor(cssHeight * f));
    // canvas.style.width = w + "px";
    // canvas.style.height = h + "px";
    // canvas.width = Math.max(1, Math.floor(w * dpr));
    // canvas.height = Math.max(1, Math.floor(h * dpr));
    // try {
    //   (rive as any)?.resizeDrawingSurfaceToCanvas?.();
    // } catch {}
  }

  const cleanup = () => {
    try {
      (rive as any)?.cleanup?.();
    } catch {}
    dom.destroy();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

  return { play, setImage, setPosition, setZoom, destroy: cleanup };
}
