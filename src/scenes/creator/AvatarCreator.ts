// src/scenes/creator/AvatarCreator.ts
import Phaser from "phaser";
import { t } from "@/i18n/i18n";
import { loadSave, saveSave } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";

export class AvatarCreator extends Phaser.Scene {
  private avatar!: ReturnType<typeof createPaperDollAvatar>;
  private headIdx = 0;
  private torsoIdx = 0;

  constructor() {
    super("AvatarCreator");
  }

  preload() {
    const { width, height } = this.scale;

    const saved = loadSave();
    this.headIdx = saved?.avatar?.headTex || 0;
    this.torsoIdx = saved?.avatar?.torsoTex || 0;
    this.avatar = createPaperDollAvatar(
      this,
      (2 * width) / 3,
      height / 2,
      saved?.avatar,
      { width: 140, height: 200 } // editor bbox; tweak to taste
    );
    // Keep avatar static in the editor
    const body = this.avatar.body.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true).setVelocity(0, 0);
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 40, "Avatar Creator", {
        fontSize: "26px",
        color: "#a7f3d0",
      })
      .setOrigin(0.5);

    // Optional visual scale in the editor
    // this.avatar.setVisualScale?.(1.0);
    // this.avatar.play("idle", true);

    // Head selector
    this.add
      .text(width / 3 - 140, 195, "Head", {
        fontSize: "16px",
        color: "#e2e8f0",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 3 - 210, 190, "◀", { fontSize: "20px", color: "#fde68a" })
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.cycle("head", -1));
    this.add
      .text(width / 3 - 90, 190, "▶", { fontSize: "20px", color: "#fde68a" })
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.cycle("head", +1));

    // Torso selector
    this.add
      .text(width / 3 - 140, 265, "Torso", {
        fontSize: "16px",
        color: "#e2e8f0",
      })
      .setOrigin(0.5);
    this.add
      .text(width / 3 - 210, 260, "◀", { fontSize: "20px", color: "#fde68a" })
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.cycle("torso", -1));
    this.add
      .text(width / 3 - 90, 260, "▶", { fontSize: "20px", color: "#fde68a" })
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.cycle("torso", +1));

    // Save & Back
    this.add
      .text(width / 2, 372, t("buttons.save"), {
        fontSize: "18px",
        color: "#fde68a",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.saveAndExit());

    this.add
      .text(width / 2, 410, t("buttons.back"), {
        fontSize: "16px",
        color: "#93c5fd",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.scene.start("MainMenu"));
  }

  private async cycle(kind: "head" | "torso", dir: number) {
    if (kind === "head") {
      this.headIdx = this.headIdx + dir;
    } else {
      this.torsoIdx = this.torsoIdx + dir;
    }
    this.applySelection();
    this.avatar.play("hi", true);
  }

  private applySelection() {
    this.avatar.setLook({
      headTex: this.headIdx,
      torsoTex: this.torsoIdx,
    });
  }

  private saveAndExit() {
    const data = loadSave();
    data.avatar = {
      ...(data.avatar || {}),
      headTex: this.headIdx,
      torsoTex: this.torsoIdx,
    } as any;
    saveSave(data);
    this.scene.start("Cutscene", { key: "ch1" });
  }
}
