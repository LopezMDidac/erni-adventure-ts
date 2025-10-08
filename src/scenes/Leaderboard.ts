import Phaser from "phaser";
import { loadSave } from "@/systems/save";
import { t } from "@/i18n/i18n";

export class Leaderboard extends Phaser.Scene {
  constructor() { super("Leaderboard"); }
  create() {
    const { width } = this.scale;
    const save = loadSave();
    this.add.text(width/2, 60, t("leaderboard.title"), { fontSize: "32px", color: "#e2e8f0" }).setOrigin(0.5);
    const entries = Object.entries(save.best);
    if (!entries.length) {
      this.add.text(width/2, 220, t("leaderboard.empty"), { fontSize: "20px", color: "#93c5fd" }).setOrigin(0.5);
    } else {
      entries.sort((a,b) => b[1]-a[1]).slice(0, 10).forEach(([k,v],i) => {
        this.add.text(140, 120 + i*28, `${i+1}. ${k}`, { fontSize: "18px", color: "#a7f3d0" });
        this.add.text(560, 120 + i*28, `${v}`, { fontSize: "18px", color: "#fde68a" });
      });
    }
    this.add.text(width/2, 420, t("buttons.back"), { fontSize: "18px", color: "#93c5fd" }).setOrigin(0.5).setInteractive()
      .on("pointerup", () => this.scene.start("MainMenu"));
  }
}
