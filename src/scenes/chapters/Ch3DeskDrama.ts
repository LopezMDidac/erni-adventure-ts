// src/scenes/chapters/Ch3DeskDrama.ts
import Phaser from "phaser";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";
import { ASSET } from "@/utils/assets";

export class Ch3DeskDrama extends Phaser.Scene {
  private player!: ReturnType<typeof createPaperDollAvatar>;
  private enemy!: ReturnType<typeof createPaperDollAvatar>;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private timeLeftMs = 30_000; // 30 seconds to win
  private timerText!: Phaser.GameObjects.Text;

  private readonly GRAVITY_Y = 900;
  private readonly PLAYER_SPEED = 200;
  private readonly ENEMY_SPEED = 170;
  private nextEnemyJump?: Phaser.Time.TimerEvent;

  constructor() {
    super("Ch3DeskDrama");
  }

  create() {
    this.timeLeftMs = 30_000;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#1e293b");
    this.physics.world.gravity.y = this.GRAVITY_Y;

    this.add.text(10, 10, "Ch3: Desk Drama (Persecution)", {
      fontSize: "16px",
      color: "#e2e8f0",
    });

    // --- Ground (STATIC) ----------------------------------------------------
    const ground = this.add.rectangle(
      width / 2,
      height - 20,
      width,
      40,
      0x1f2937
    );
    this.physics.add.existing(ground, true);
    (ground.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject(); // <- sync rect → body

    // --- Player (DYNAMIC) ---------------------------------------------------
    const save = loadSave();
    this.player = createPaperDollAvatar(this, 160, height - 180, save.avatar, {
      width: 52,
      height: 90,
    });
    const pBody = this.player.body.body as Phaser.Physics.Arcade.Body;
    // Re-center collider and enable gravity, collisions, bounds
    pBody
      .setSize(pBody.width, pBody.height, true)
      .setAllowGravity(true)
      .setImmovable(false);
    pBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.body, ground);

    // --- Enemy (DYNAMIC, different look) -----------------------------------
    //const rivalLook = this.randomDifferentLook(save?.avatar);
    this.enemy = createPaperDollAvatar(
      this,
      width - 160,
      height - 180,
      save?.avatar,
      {
        width: 52,
        height: 90,
      }
    );
    const eBody = this.enemy.body.body as Phaser.Physics.Arcade.Body;
    eBody
      .setSize(eBody.width, eBody.height, true)
      .setAllowGravity(true)
      .setImmovable(false);
    eBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.enemy.body, ground);

    // --- Collision between avatars = fail -----------------------------------
    this.physics.add.overlap(this.player.body, this.enemy.body, () =>
      this.lose()
    );

    // Controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // UI: countdown
    this.timerText = this.add
      .text(width - 120, 10, "00:30", { fontSize: "18px", color: "#93c5fd" })
      .setOrigin(1, 0);

    // Enemy random jumps
    this.scheduleEnemyJump();

    // Start anims
    this.player.play("run", true);
    this.enemy.play("run", true);

    // --- Update loop --------------------------------------------------------
    this.events.on(
      Phaser.Scenes.Events.UPDATE,
      (_time: number, delta: number) => {
        // Player movement
        pBody.setVelocityX(0);
        if (this.cursors.left?.isDown) pBody.setVelocityX(-this.PLAYER_SPEED);
        if (this.cursors.right?.isDown) pBody.setVelocityX(this.PLAYER_SPEED);
        if (this.cursors.up?.isDown && pBody.touching.down)
          pBody.setVelocityY(-500);

        // Facing (if available)
        // const pDir =
        //   pBody.velocity.x === 0 ? undefined : Math.sign(pBody.velocity.x);
        // (this.player as any).setFacing?.(pDir ?? 1);

        // Player anims
        if (!pBody.blocked.down && pBody.velocity.y < -10)
          this.player.play("jump", true);
        else if (Math.abs(pBody.velocity.x) > 10) this.player.play("run", true);
        else this.player.play("idle", true);

        // Enemy AI: chase horizontally

        if (pBody.velocity.y == 0) {
          const dir =
            Math.sign(
              pBody.x + pBody.width * 0.5 - (eBody.x + eBody.width * 0.5)
            ) || 1;
          eBody.setVelocityX(dir * this.ENEMY_SPEED);
          (this.enemy as any).setFacing?.(dir);
        }

        // Enemy anims
        if (!eBody.blocked.down && eBody.velocity.y < -10)
          this.enemy.play("jump", true);
        else if (Math.abs(eBody.velocity.x) > 10) this.enemy.play("run", true);
        else this.enemy.play("idle", true);

        // Win timer
        this.timeLeftMs = Math.max(0, this.timeLeftMs - delta);
        this.timerText.setText(this.formatTime(this.timeLeftMs));
        if (this.timeLeftMs <= 0) this.win();
      }
    );
  }

  // Random jump between 5–12s
  private scheduleEnemyJump() {
    const delay = Phaser.Math.Between(5000, 12000);
    this.nextEnemyJump = this.time.delayedCall(delay, () => {
      const eBody = this.enemy.body.body as Phaser.Physics.Arcade.Body;
      if (eBody.blocked.down || eBody.touching.down) {
        eBody.setVelocityY(-360);
        this.enemy.play("jump", false);
      }
      this.scheduleEnemyJump();
    });
  }

  // Ensure rival's look differs from player’s saved head/torso
  private randomDifferentLook(playerLook?: {
    headTex?: string;
    torsoTex?: string;
  }) {
    const HEADS = [
      ASSET("/assets/avatar/heads/head_00.png"),
      ASSET("/assets/avatar/heads/head_01.png"),
      ASSET("/assets/avatar/heads/head_02.png"),
      ASSET("/assets/avatar/heads/head_03.png"),
      ASSET("/assets/avatar/heads/head_04.png"),
      ASSET("/assets/avatar/heads/head_05.png"),
    ];
    const TORSOS = [
      ASSET("/assets/avatar/torsos/torso_00.png"),
      ASSET("/assets/avatar/torsos/torso_01.png"),
      ASSET("/assets/avatar/torsos/torso_02.png"),
    ];

    const pickDifferent = (arr: string[], not?: string) => {
      const pool = not ? arr.filter((v) => v !== not) : arr.slice();
      return pool[Phaser.Math.Between(0, pool.length - 1)];
    };

    return {
      headTex: pickDifferent(HEADS, playerLook?.headTex),
      torsoTex: pickDifferent(TORSOS, playerLook?.torsoTex),
    };
  }

  private formatTime(ms: number) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  private win() {
    const data = loadSave();
    unlockLevel(data, "Ch4TechTrouble");
    saveSave(data);
    this.scene.start("Results", {
      title: "Outmaneuvered!",
      subtitle: "You stayed ahead for 30 seconds.",
      unlock: "Ch4TechTrouble",
      sourceLevel: "Ch3DeskDrama",
    });
  }

  private lose() {
    this.scene.start("Results", {
      title: "Caught!",
      subtitle: "Try to keep some distance next time.",
      sourceLevel: "Ch3DeskDrama",
    });
  }

  shutdown() {
    this.nextEnemyJump?.remove(false);
  }
  destroy() {
    this.nextEnemyJump?.remove(false);
  }
}
