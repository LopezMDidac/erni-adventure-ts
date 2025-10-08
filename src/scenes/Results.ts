import Phaser from "phaser";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { NextCutsceneAfterLevel } from "@/systems/story";
import { t } from "@/i18n/i18n";

export class Results extends Phaser.Scene {
  constructor() { super("Results"); }

  create(data: { title?: string; subtitle?: string; nextLevel?: string; unlock?: string; sourceLevel?: string }) {
    const { width } = this.scale;
    this.add.text(width/2, 130, data.title ?? "Results", { fontSize: "38px", color: "#a7f3d0" }).setOrigin(0.5);
    this.add.text(width/2, 190, data.subtitle ?? "", { fontSize: "20px", color: "#e2e8f0" }).setOrigin(0.5);

    if (data.unlock) {
      const save = loadSave(); unlockLevel(save, data.unlock); saveSave(save);
      this.add.text(width/2, 220, `Unlocked: ${data.unlock}`, { fontSize: "18px", color: "#fde68a" }).setOrigin(0.5);
    }

    const back = this.add.text(width/2, 320, t("buttons.back"), { fontSize: "20px", color: "#93c5fd" }).setOrigin(0.5).setInteractive();
    back.on("pointerup", () => this.scene.start("LevelSelect"));

    const retry = this.add.text(width/2, 280, t("buttons.retry"), { fontSize: "20px", color: "#fde68a" }).setOrigin(0.5).setInteractive();
    retry.on("pointerup", () => this.scene.start(data.sourceLevel ?? "LevelSelect"));

    const nextCut = data.sourceLevel ? NextCutsceneAfterLevel[data.sourceLevel] : undefined;
    if (nextCut) {
      const next = this.add.text(width/2, 360, t("buttons.continue_story"), { fontSize: "20px", color: "#bbf7d0" }).setOrigin(0.5).setInteractive();
      next.on("pointerup", () => this.scene.start("Cutscene", { key: nextCut }));
    }
  }
}
