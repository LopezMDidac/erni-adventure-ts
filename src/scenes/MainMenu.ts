import Phaser from "phaser";
import { t, setLang, getLang } from "@/i18n/i18n";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const { width } = this.scale;

    this.add
      .text(width / 2, 80, t("title"), {
        fontSize: "28px",
        color: "#e2e8f0",
        align: "center",
        wordWrap: { width: 740 },
      })
      .setOrigin(0.5);

    const story = this.add
      .text(width / 2, 170, `▶ ${t("menu.story_mode")}`, {
        fontSize: "28px",
        color: "#a7f3d0",
      })
      .setOrigin(0.5)
      .setInteractive();
    story.on("pointerup", () => this.scene.start("Cutscene", { key: "intro" }));

    const levels = this.add
      .text(width / 2, 220, `🗂 ${t("menu.level_select")}`, {
        fontSize: "24px",
        color: "#fde68a",
      })
      .setOrigin(0.5)
      .setInteractive();
    levels.on("pointerup", () => this.scene.start("LevelSelect"));

    const avatar = this.add
      .text(width / 2, 265, `🧑‍🎨 ${t("menu.avatar_creator")}`, {
        fontSize: "22px",
        color: "#93c5fd",
      })
      .setOrigin(0.5)
      .setInteractive();
    avatar.on("pointerup", () => this.scene.start("AvatarCreator"));

    const lb = this.add
      .text(width / 2, 305, `🏆 ${t("menu.leaderboard")}`, {
        fontSize: "22px",
        color: "#bbf7d0",
      })
      .setOrigin(0.5)
      .setInteractive();
    lb.on("pointerup", () => this.scene.start("Leaderboard"));

    // Language toggle
    this.add.text(40, 400, `${t("menu.language")}:`, {
      fontSize: "18px",
      color: "#e2e8f0",
    });
    const en = this.add
      .text(160, 400, t("buttons.english"), {
        fontSize: "18px",
        color: getLang() === "en" ? "#bbf7d0" : "#93c5fd",
      })
      .setInteractive();
    const es = this.add
      .text(280, 400, t("buttons.spanish"), {
        fontSize: "18px",
        color: getLang() === "es" ? "#bbf7d0" : "#93c5fd",
      })
      .setInteractive();
    en.on("pointerup", () => {
      setLang("en");
      this.scene.restart();
    });
    es.on("pointerup", () => {
      setLang("es");
      this.scene.restart();
    });
  }
}
