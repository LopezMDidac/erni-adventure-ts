import Phaser from "phaser";
import { loadSave, saveSave, unlockLevel, recordBest } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";
import { t } from "@/i18n/i18n";

export class Ch7ChurroRush extends Phaser.Scene {
  private runner!: ReturnType<typeof createPaperDollAvatar>;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private distance = 2000;
  private speed = 200;
  private traveled = 0;
  private lastTime = 0;

  constructor() { super("Ch7ChurroRush"); }

  create() {
    const { width, height } = this.scale;
    this.add.text(10, 10, "Ch7: Churro Rush (Race)", { fontSize: "16px", color: "#e2e8f0" });
    this.add.text(10, 30, t("hud.ch7_instr"), { fontSize: "14px", color: "#93c5fd" });

    this.runner = createPaperDollAvatar(this, 120, height - 60, loadSave().avatar);

    const ground = this.add.rectangle(width/2, height - 20, width, 40, 0x1f2937);
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.runner.body, ground);

    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.time.addEvent({ delay: 900, loop: true, callback: () => this.spawnObstacle() });

    const cursors = this.input.keyboard?.createCursorKeys();
    this.events.on("update", () => {
      if (Phaser.Input.Keyboard.JustDown(cursors!.up!)) {
        this.runner.body.setVelocityY(-360);
        this.runner.play("jump", false);
      }
      if (this.runner.body.body.velocity.y === 0) {
        this.runner.play("run", true);
      }
    });

    this.physics.add.overlap(this.runner.body, this.obstacles, () => this.fail(), undefined, this);
    this.lastTime = this.time.now;
  }

  spawnObstacle() {
    const { height } = this.scale;
    const r = this.add.rectangle(820, height - 48, 20, 36, 0xfca5a5);
    this.obstacles.add(r);
    this.tweens.add({ targets: r, x: -40, duration: 4000, onComplete: () => r.destroy() });
  }

  update() {
    const now = this.time.now;
    const dt = now - this.lastTime;
    this.lastTime = now;
    this.traveled += (this.speed * dt) / 1000;
    if (this.traveled >= this.distance) {
      const ms = Math.floor(now / 1) % 100000;
      recordBest("Ch7ChurroRush", 3000 - (ms % 3000));
      const data = loadSave(); unlockLevel(data, "Ch8ColdOffice"); saveSave(data);
      this.scene.start("Results", { title: "Churro claimed!", subtitle: "Sweet victory.", unlock: "Ch8ColdOffice", sourceLevel: "Ch7ChurroRush" });
    }
  }

  fail() {
    this.scene.start("Results", { title: "Tripped!", subtitle: "Someone else got the churro.", sourceLevel: "Ch7ChurroRush" });
  }
}
