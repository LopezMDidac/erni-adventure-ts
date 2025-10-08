import Phaser from "phaser";
import data from "@/data/insults.json";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";

export class Ch6MeetingMayhem extends Phaser.Scene {
  private idx = 0;
  private score = 0;
  private avatar!: ReturnType<typeof createPaperDollAvatar>;

  constructor() { super("Ch6MeetingMayhem"); }

  create() {
    const { width } = this.scale;
    this.add.text(width/2, 50, "Ch6: Meeting Mayhem (Insult Duel)", { fontSize: "26px", color: "#fbcfe8" }).setOrigin(0.5);

    // show avatar idle at left
    this.avatar = createPaperDollAvatar(this, 80, 320, loadSave().avatar);
    this.avatar.play("idle", true);

    this.showRound();
  }

  showRound() {
    const { width } = this.scale;
    this.children.getChildren().filter(g => (g as any).getData?.("duel")).forEach(g => g.destroy());

    const container = this.add.container(0,0); (container as any).setDataEnabled(); (container as any).data.set("duel", true);

    const pair = (data as any).pairs[this.idx % (data as any).pairs.length];
    container.add(this.add.text(200, 120, "Rival:", { fontSize: "20px", color: "#93c5fd" }));
    container.add(this.add.text(200, 150, pair.insult, { fontSize: "20px", wordWrap: { width: 560 } }));

    const options = Phaser.Utils.Array.Shuffle([ ...pair.retorts, ...(data as any).pairs[(this.idx+1)%((data as any).pairs.length)].retorts ]).slice(0, 3);
    options.forEach((opt, i) => {
      const t = this.add.text(220, 240 + i*40, `• ${opt}`, { fontSize: "18px", color: "#e2e8f0" }).setInteractive();
      container.add(t);
      t.on("pointerup", () => this.choose(opt, pair.retorts));
    });
  }

  choose(opt: string, correct: string[]) {
    const good = correct.includes(opt);
    this.score += good ? 1 : 0;
    this.idx++;
    this.avatar.play(good ? "win" : "hurt", false);

    if (this.score >= 3) {
      const data = loadSave(); unlockLevel(data, "Ch7ChurroRush"); saveSave(data);
      this.scene.start("Results", { title: "Room secured!", subtitle: "Respectfully persuasive.", unlock: "Ch7ChurroRush", sourceLevel: "Ch6MeetingMayhem" });
    } else if (this.idx >= 6) {
      this.scene.start("Results", { title: "They kept the room!", subtitle: "Collect more retorts and try again.", sourceLevel: "Ch6MeetingMayhem" });
    } else {
      this.showRound();
    }
  }
}
