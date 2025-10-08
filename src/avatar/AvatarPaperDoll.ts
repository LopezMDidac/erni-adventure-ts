// src/avatar/AvatarPaperDoll.ts
import Phaser from "phaser";
import { createRiveAvatarOverlay, AnimName } from "@/avatar/RiveAvatarOverlay";
import type { AvatarSaved } from "@/systems/save";
import { ASSET } from "@/utils/assets";

export type PaperDollAvatar = {
  body: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  play: (name: AnimName, loop?: boolean) => void;
  setLook: (cfg: AvatarSaved | any) => void;
  setVisualScale: (s: number) => void;
  destroy: () => void;
};

type BBox = { width: number; height: number };

export function createPaperDollAvatar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  cfg: AvatarSaved | any = {},
  bbox: BBox = { width: 28, height: 46 } // ⬅️ NEW: bounding box
): PaperDollAvatar {
  const baseW = Math.max(1, Math.floor(bbox.width));
  const baseH = Math.max(1, Math.floor(bbox.height));
  let scale = 1;

  const body = scene.physics.add
    .sprite(x, y, undefined as any)
    .setSize(baseW, baseH);

  let overlayReady = false;
  let pendingAnim: AnimName | null = "idle";
  let lastLook: any = cfg ?? {};

  const overlay = createRiveAvatarOverlay(scene, {
    x,
    y, // align center-to-center
    cssWidth: baseW,
    cssHeight: baseH,
    src: ASSET("/assets/rive/avatar.riv"),
    artboard: "Avatar",
    stateMachine: "AvatarSM",
    onReady: async () => {
      overlayReady = true;
      // apply initial visual scale in case caller changes it immediately
      (overlay as any).setZoom?.(scale);
      await applyLook(lastLook);
      if (pendingAnim) overlay.play(pendingAnim);
    },
  });

  const follow = () => {
    overlay?.setPosition?.(body.x, body.y);
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, follow);

  // ----- helpers ------------------------------------------------------------
  async function applyLook(c: any) {
    if (!c || !overlayReady) return;
    if (c.headTex) await overlay.setImage("HeadImage", c.headTex);
    if (c.torsoTex) await overlay.setImage("TorsoImage", c.torsoTex);
  }

  function play(name: AnimName, _loop = true) {
    pendingAnim = name;
    if (overlayReady) overlay.play(name);
  }

  // Keep body & overlay the same *visible* size
  function setVisualScale(s: number) {
    scale = Math.max(0.01, s);
    // Resize the *physics body* to match scaled overlay
    const w = Math.max(1, Math.round(baseW * scale));
    const h = Math.max(1, Math.round(baseH * scale));
    body.setSize(w, h).setOffset(-w / 2, -h / 2);
    // Resize the *overlay canvas* (crisp) — not just CSS transform
    (overlay as any)?.setZoom?.(scale);
  }

  function setLook(newCfg: AvatarSaved | any) {
    lastLook = { ...(lastLook || {}), ...(newCfg || {}) };
    void applyLook(lastLook);
  }

  function destroy() {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, follow);
    try {
      overlay?.destroy?.();
    } catch {}
    body.destroy();
  }

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
  scene.events.once(Phaser.Scenes.Events.DESTROY, destroy);

  // initial state
  void applyLook(lastLook);
  play("idle", true);

  return {
    body: body as any,
    // container,
    play,
    setLook,
    setVisualScale,
    destroy,
  };
}
