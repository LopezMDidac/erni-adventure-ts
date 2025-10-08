import Phaser from "phaser";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";
import { t } from "@/i18n/i18n";

export class Ch8ColdOffice extends Phaser.Scene {
  private player!: ReturnType<typeof createPaperDollAvatar>;
  private vents: Phaser.GameObjects.Ellipse[] = [];
  private goal!: Phaser.GameObjects.Rectangle;

  constructor() { super("Ch8ColdOffice"); }

  create() {
    const { width, height } = this.scale;
    this.add.text(10, 10, "Ch8: Cold Office (Stealth)", { fontSize: "16px", color: "#e2e8f0" });
    this.add.text(10, 30, t("hud.ch8_instr"), { fontSize: "14px", color: "#93c5fd" });

    this.physics.world.setBounds(20, 60, width-40, height-100);

    this.player = createPaperDollAvatar(this, 60, height - 80, loadSave().avatar);
    this.player.body.setCollideWorldBounds(true);

    this.goal = this.add.rectangle(width - 60, 90, 60, 30, 0xbbf7d0);
    this.physics.add.existing(this.goal, true);

    const cursors = this.input.keyboard?.createCursorKeys();
    this.events.on("update", () => {
      const speed = 160;
      this.player.body.setVelocity(0);
      if (cursors?.left?.isDown) this.player.body.setVelocityX(-speed);
      if (cursors?.right?.isDown) this.player.body.setVelocityX(speed);
      if (cursors?.up?.isDown) this.player.body.setVelocityY(-speed);
      if (cursors?.down?.isDown) this.player.body.setVelocityY(speed);

      if (this.player.body.body.velocity.length() > 0) this.player.play("run", true);
      else this.player.play("idle", true);
    });

    for (let i=0;i<3;i++) {
      const e = this.add.ellipse(200 + i*160, 120 + i*80, 120, 60, 0x60a5fa, 0.25);
      this.vents.push(e);
      this.tweens.add({ targets: e, x: e.x + Phaser.Math.Between(-80, 80), y: e.y + Phaser.Math.Between(-20, 20), yoyo: true, repeat: -1, duration: 2000 + i*300 });
    }

    this.time.addEvent({ delay: 30, loop: true, callback: () => this.check() });
  }

  check() {
    const playerRect = new Phaser.Geom.Rectangle(this.player.body.x-10, this.player.body.y-10, 20, 20);
    if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, (this.goal.body as any).getBounds())) {
      const data = loadSave(); unlockLevel(data, "Ch1AccessDenied"); saveSave(data);
      this.scene.start("Results", { title: "Warm again!", subtitle: "Reception to the rescue.", sourceLevel: "Ch8ColdOffice" });
      return;
    }
    for (const e of this.vents) {
      const inside = Phaser.Geom.Ellipse.Contains(e.geom as any, this.player.body.x, this.player.body.y);
      if (inside) {
        this.scene.start("Results", { title: "Brrr! Frostbitten.", subtitle: "Avoid the AC blasts.", sourceLevel: "Ch8ColdOffice" });
        return;
      }
    }
  }
}
