// src/scenes/chapters/Ch2HRInterception.ts
import Phaser from "phaser";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";

export class Ch2HRInterception extends Phaser.Scene {
  private player!: ReturnType<typeof createPaperDollAvatar>;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private spawnCooldown = 0; // ms until next random spawn

  private readonly speed = 200;
  private gravityY = 600;

  private topKill!: Phaser.GameObjects.Rectangle;
  private botKill!: Phaser.GameObjects.Rectangle;

  private passed = 0;
  private passGoal = 10;

  constructor() {
    super("Ch2HRInterception");
  }

  preload() {
    const { height } = this.scale;
    const save = loadSave();
    this.player = createPaperDollAvatar(this, 120, height / 2, save.avatar, {
      width: 52,
      height: 90,
    });
    this.player.play("fall", true);
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#1e293b");

    // Gravity (configurable)
    this.physics.world.gravity.y = this.gravityY;

    this.add.text(12, 45, "Ch2: HR Interception (Flappy-like)", {
      fontSize: "16px",
      color: "#e2e8f0",
    });
    this.add.text(
      12,
      65,
      `Tap / Space to flap — g=${this.physics.world.gravity.y}`,
      {
        fontSize: "12px",
        color: "#93c5fd",
      }
    );

    const body = this.player.body.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false).setVelocity(0, 0); // gravity inherited from world

    // Input: flap + "jab" animation, burst of "paperwork", then return to "fall"
    const flap = () => {
      body.setVelocityY(-300);
      this.player.play("jab", false);
      this.spawnPaperworkBurst(
        this.player.body.x + 20,
        this.player.body.y - 40
      );
      this.time.delayedCall(500, () => this.player.play("fall", true));
    };
    this.input.on("pointerdown", flap);
    this.input.keyboard?.on("keydown-SPACE", flap);

    // Kill zones (top/bottom) – fail on overlap
    this.topKill = this.add.rectangle(width / 2, 20, width, 40, 0xb83838, 0.5);
    this.botKill = this.add.rectangle(
      width / 2,
      height - 20,
      width,
      40,
      0xb83838,
      0.5
    );
    this.physics.add.existing(this.topKill, true);
    this.physics.add.existing(this.botKill, true);
    this.physics.add.overlap(this.player.body, this.topKill, () => this.fail());
    this.physics.add.overlap(this.player.body, this.botKill, () => this.fail());

    // Obstacles (group)
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.physics.add.collider(this.player.body, this.obstacles, () =>
      this.fail()
    );

    // initial spawn cooldown (ms)
    this.spawnCooldown = 400;
  }

  update(time: number, delta: number) {
    const { width } = this.scale;

    // Keep player's X fixed (classic flappy feel)
    const b = this.player.body.body as Phaser.Physics.Arcade.Body;
    b.x = 120;

    // Random spawn logic (simple cooldown + chance)
    this.spawnCooldown -= delta;
    if (this.spawnCooldown <= 0) {
      if (Math.random() < 0.35) this.spawnObstacle(); // ~one every ~1s on average
      this.spawnCooldown = Phaser.Math.Between(250, 1000);
    }

    // Cleanup off-screen obstacles
    this.obstacles.getChildren().forEach((obj: any) => {
      const rb = obj.body as Phaser.Physics.Arcade.Body;
      if (rb && rb.x + rb.width < -80) {
        obj.destroy();
        this.passed++;
        if (this.passed >= this.passGoal) this.win();
      }
    });
  }

  // === Helpers ===============================================================

  /** Create a single square obstacle that moves leftwards and fails on collision */
  private spawnObstacle() {
    const { width, height } = this.scale;
    const size = Phaser.Math.Between(36, 64); // square
    const margin = 60; // keep away from kill zones
    const y = Phaser.Math.Between(margin, height - margin); // random vertical pos
    const x = width - size - 12;

    const rect = this.add
      .rectangle(x, y, size, size, 0x93c5fd, 1)
      .setOrigin(0.5);

    this.physics.add.existing(rect);
    this.obstacles.add(rect);

    const rb = rect.body as Phaser.Physics.Arcade.Body;
    rb.setAllowGravity(false)
      .setImmovable(true) // won't be pushed by collisions
      .setVelocityX(-this.speed)
      .setBounce(0);

    rb.setEnable(true);
    rb.moves = true;
  }

  /** Emit short “paperwork” lines flying outwards (visual only) */
  private spawnPaperworkBurst(x: number, y: number) {
    const COUNT = 8;
    for (let i = 0; i < COUNT; i++) {
      const len = Phaser.Math.Between(18, 36);
      const ang = Phaser.Math.FloatBetween(-Math.PI * 0.7, Math.PI * 0.7); // forward-ish cone
      const dist = Phaser.Math.Between(120, 220);
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;

      const line = this.add
        .rectangle(x, y, len, 2, 0xfef3c7, 0.9)
        .setOrigin(0.5);
      line.rotation = ang;

      this.tweens.add({
        targets: line,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        duration: Phaser.Math.Between(350, 500),
        ease: "quad.out",
        onComplete: () => line.destroy(),
      });
    }
  }

  private win() {
    const data = loadSave();
    unlockLevel(data, "Ch3DeskDrama");
    saveSave(data);
    this.scene.start("Results", {
      title: "HR satisfied!",
      subtitle: "You made it through the office gauntlet.",
      unlock: "Ch3DeskDrama",
      sourceLevel: "Ch2HRInterception",
    });
  }

  private fail() {
    this.scene.start("Results", {
      title: "Oops! Blocked by HR",
      subtitle: "Give it another go?",
      sourceLevel: "Ch2HRInterception",
    });
  }
}
