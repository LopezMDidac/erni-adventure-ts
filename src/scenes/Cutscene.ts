import Phaser from "phaser";
import { NextSceneFor } from "@/systems/story";
import { lore as getLore, t } from "@/i18n/i18n";

export class Cutscene extends Phaser.Scene {
  private lines: { who?: string; text: string }[] = [];
  private idx = 0;
  private key = "intro";

  constructor() { super("Cutscene"); }

  init(data: { key?: string }) { this.key = data?.key ?? "intro"; }

  create() {
    this.lines = getLore(this.key) ?? [{ text: "(missing cutscene)" }];
    this.idx = 0;

    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width-60, height-60, 0x111827).setStrokeStyle(2, 0x334155);
    this.input.on("pointerup", () => this.advance());
    this.advance();
    this.add.text(width/2, height - 30, t("cutscene.click"), { fontSize: "16px", color: "#64748b" }).setOrigin(0.5);
  }

  advance() {
    const { width } = this.scale;
    this.children.getChildren().forEach(c => c.destroy());
    this.add.rectangle(width/2, this.scale.height/2, this.scale.width-60, this.scale.height-60, 0x111827).setStrokeStyle(2, 0x334155);

    const line = this.lines[this.idx];
    if (!line) {
      const next = NextSceneFor[this.key] ?? "LevelSelect";
      return this.scene.start(next);
    }
    if (line.who) this.add.text(60, 120, `${line.who}:`, { fontSize: "20px", color: "#93c5fd" });
    this.add.text(60, 160, line.text, { fontSize: "22px", wordWrap: { width: 680 } });
    this.idx++;
  }
}
