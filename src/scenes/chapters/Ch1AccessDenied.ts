// src/scenes/chapters/Ch1AccessDenied.ts
import Phaser from "phaser";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";

export class Ch1AccessDenied extends Phaser.Scene {
  private avatar!: ReturnType<typeof createPaperDollAvatar>;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private maxY = 0;

  constructor() {
    super("Ch1AccessDenied");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#1e293b");
    this.add.text(10, 10, "Ch1: Access Denied (DoodleJump)", {
      fontSize: "16px",
      color: "#e2e8f0",
    });

    // 1) Static one-way platforms
    this.platforms = this.physics.add.staticGroup();
    const addOneWay = (
      x: number,
      y: number,
      w: number,
      h: number,
      color = 0x6fa8dc
    ) => {
      const r = this.add.rectangle(x, y, w, h, color);
      this.physics.add.existing(r, true);
      const body = r.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.up = true;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      this.platforms.add(r);
      return r;
    };

    // Floor + dense platforms
    addOneWay(width / 2, height - 10, width, 20, 0x1f2937);
    const PLATFORM_COUNT = 40;
    const SPACING = 60;
    const START_Y = height - 120;
    for (let i = 0; i < PLATFORM_COUNT; i++) {
      const x = Phaser.Math.Between(80, width - 80);
      const y = START_Y - i * SPACING;
      addOneWay(x, y, 100, 12, 0x6fa8dc);
    }

    // 2) Player (Rive-backed avatar via AvatarPaperDoll)
    const save = loadSave();
    this.avatar = createPaperDollAvatar(
      this,
      width / 2,
      height - 40,
      save.avatar,
      { width: 28 * 2, height: 46 * 2 } // custom bounding box size
    );
    //this.avatar.setVisualScale?.(0.8); // smaller visual size
    this.avatar.play("jump", true);

    // 3) Collide only when falling (one-way behavior)
    this.physics.add.collider(
      this.avatar.body,
      this.platforms,
      () => {
        const v = (this.avatar.body.body as Phaser.Physics.Arcade.Body).velocity
          .y;
        if (v >= 0) {
          this.avatar.body.setVelocityY(-550);
          this.avatar.play("jump", true);
        }
      },
      () => (this.avatar.body.body as Phaser.Physics.Arcade.Body).velocity.y > 0
    );

    // 4) Camera follow
    this.cameras.main.startFollow(this.avatar.body, true, 0.1, 0.1, 0, 150);
    this.cameras.main.setDeadzone(width, 100);
    this.maxY = this.avatar.body.y;

    // 5) Controls
    this.input.keyboard?.on("keydown-LEFT", () =>
      this.avatar.body.setVelocityX(-200)
    );
    this.input.keyboard?.on("keyup-LEFT", () =>
      this.avatar.body.setVelocityX(0)
    );
    this.input.keyboard?.on("keydown-RIGHT", () =>
      this.avatar.body.setVelocityX(200)
    );
    this.input.keyboard?.on("keyup-RIGHT", () =>
      this.avatar.body.setVelocityX(0)
    );

    // 6) Visible bounding box (no global debug needed)
  }

  update() {
    const cam = this.cameras.main;
    const { width, height } = this.scale;

    // Draw the avatar body's bounding box
    const b = this.avatar.body.body as Phaser.Physics.Arcade.Body;

    // Wrap horizontally
    if (this.avatar.body.x < -10) this.avatar.body.x = width + 10;
    if (this.avatar.body.x > width + 10) this.avatar.body.x = -10;

    // Cleanup off-screen platforms
    const killY = cam.scrollY + height + 30;
    this.platforms.getChildren().forEach((obj: any) => {
      if (obj.y > killY) obj.destroy();
    });

    // Progress check
    this.maxY = Math.min(this.maxY, this.avatar.body.y);
    const climbed = Math.floor(height - this.maxY);
    if (climbed > 900) {
      const data = loadSave();
      unlockLevel(data, "Ch2HRInterception");
      saveSave(data);
      this.scene.start("Results", {
        title: "Anna lets you in!",
        subtitle: "You kept your footing.",
        unlock: "Ch2HRInterception",
        sourceLevel: "Ch1AccessDenied",
      });
    }

    // Fail if too far below
    if (this.avatar.body.y > cam.scrollY + height + 200) {
      this.scene.start("Results", {
        title: "Slip!",
        subtitle: "Try again?",
        sourceLevel: "Ch1AccessDenied",
      });
    }
  }
}
