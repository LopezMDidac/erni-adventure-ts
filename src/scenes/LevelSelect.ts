import Phaser from "phaser";
import { loadSave } from "@/systems/save";
import { t } from "@/i18n/i18n";

const LEVELS = [
  { id: "Ch1AccessDenied", titleKey: "levels.ch1" },
  { id: "Ch2HRInterception", titleKey: "levels.ch2" },
  { id: "Ch3DeskDrama", titleKey: "levels.ch3" },
  { id: "Ch4TechTrouble", titleKey: "levels.ch4" },
  { id: "Ch5CoffeeQuest", titleKey: "levels.ch5" },
  { id: "Ch6MeetingMayhem", titleKey: "levels.ch6" },
  { id: "Ch7ChurroRush", titleKey: "levels.ch7" },
  { id: "Ch8ColdOffice", titleKey: "levels.ch8" }
];

export class LevelSelect extends Phaser.Scene {
  constructor() { super("LevelSelect"); }
  create() {
    const data = loadSave();
    const { width } = this.scale;
    this.add.text(width/2, 70, t("menu.level_select"), { fontSize: "32px", color: "#e2e8f0" }).setOrigin(0.5);
    LEVELS.forEach((lvl, i) => {
      const y = 120 + i*40;
      const unlocked = data.unlocked.includes(lvl.id);
      const base = t(lvl.titleKey);
      const label = unlocked ? base : `${base} (locked)`;
      const color = unlocked ? "#fde68a" : "#64748b";
      const tText = this.add.text(width/2, y, label, { fontSize: "20px", color }).setOrigin(0.5);
      if (unlocked) tText.setInteractive().on("pointerup", () => this.scene.start(lvl.id));
    });
    this.add.text(width/2, 420, t("buttons.back"), { fontSize: "18px", color: "#93c5fd" }).setOrigin(0.5).setInteractive()
      .on("pointerup", () => this.scene.start("MainMenu"));
  }
}
