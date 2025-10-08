// src/scenes/chapters/Ch5CoffeeQuest.ts
import Phaser from "phaser";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";
import { t } from "@/i18n/i18n";

type DynBody = Phaser.Physics.Arcade.Body;

export class Ch5CoffeeQuest extends Phaser.Scene {
  private avatar!: ReturnType<typeof createPaperDollAvatar>;
  private items!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private needBeans = 8;
  private needWater = 6;
  private beans = 0;
  private water = 0;

  // pacing
  private spawnDelay = 900; // ms between spawns (tweak)
  private fallSpeedMin = 110; // px/s (tweak)
  private fallSpeedMax = 160; // px/s (tweak)

  constructor() {
    super("Ch5CoffeeQuest");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#1e293b");

    this.add.text(10, 10, "Ch5: Coffee Quest (Catcher)", {
      fontSize: "16px",
      color: "#e2e8f0",
    });
    this.add.text(10, 30, t("hud.ch5_instr") + "  (evita las X)", {
      fontSize: "14px",
      color: "#93c5fd",
    });

    // World gravity for jump/land
    this.physics.world.gravity.y = 900;

    // Ground (static) so the avatar can land
    const ground = this.add.rectangle(
      width / 2,
      height - 10,
      width,
      20,
      0x334155,
      0.25
    );
    this.physics.add.existing(ground, true);
    (ground.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    // Player near the bottom
    this.avatar = createPaperDollAvatar(
      this,
      width / 2,
      height - 40,
      loadSave().avatar,
      {
        width: 52,
        height: 90,
      }
    );
    const ab = this.avatar.body.body as DynBody;
    ab.setAllowGravity(true)
      .setCollideWorldBounds(true)
      .setImmovable(false)
      .setVelocity(0, 0);

    // Collide with ground
    this.physics.add.collider(this.avatar.body, ground);

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Falling items group
    this.items = this.physics.add.group();

    // Spawns
    this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: () => this.spawnItem(),
    });

    // Overlap: catch items
    this.physics.add.overlap(this.avatar.body, this.items, (_player, obj) =>
      this.catchItem(obj as Phaser.GameObjects.GameObject)
    );

    this.updateHUD();
  }

  private spawnItem() {
    const { width } = this.scale;
    const x = Phaser.Math.Between(40, width - 40);
    const r = Math.random();

    let symbol = "●",
      color = "#fde68a",
      kind: "bean" | "water" | "spill" = "bean";

    if (r < 0.45) {
      symbol = "●"; // beans
      color = "#fde68a";
      kind = "bean";
    } else if (r < 0.85) {
      symbol = "▮"; // water
      color = "#93c5fd";
      kind = "water";
    } else {
      symbol = "X"; // BAD item → fail on catch
      color = "#fca5a5";
      kind = "spill";
    }

    const label = this.add
      .text(x, -14, symbol, { fontSize: "22px", color })
      .setDepth(5);
    this.items.add(label);

    // Enable physics; fall with constant velocity (no gravity)
    this.physics.world.enable(label);
    const body = label.body as DynBody;
    body
      .setAllowGravity(false)
      .setVelocity(0, Phaser.Math.Between(this.fallSpeedMin, this.fallSpeedMax))
      .setImmovable(true);

    (label as any).setDataEnabled();
    (label as any).setData("type", kind);
  }

  private catchItem(obj: Phaser.GameObjects.GameObject) {
    const type = (obj as any).getData("type");

    // Instant fail on 'X'
    if (type === "spill") {
      obj.destroy();
      this.scene.start("Results", {
        title: "¡Ups, derrame!",
        subtitle: "Has cogido una X.",
        sourceLevel: "Ch5CoffeeQuest",
      });
      return;
    }

    if (type === "bean") this.beans++;
    else if (type === "water") this.water++;

    obj.destroy();
    this.updateHUD();

    if (this.beans >= this.needBeans && this.water >= this.needWater) {
      const data = loadSave();
      unlockLevel(data, "Ch6MeetingMayhem");
      saveSave(data);
      this.scene.start("Results", {
        title: "Coffee ready!",
        subtitle: "Kitchen refilled.",
        unlock: "Ch6MeetingMayhem",
        sourceLevel: "Ch5CoffeeQuest",
      });
    }
  }

  private updateHUD() {
    // Clear previous HUD entries
    this.children.getChildren().forEach((c) => {
      if ((c as any).getData?.("hud")) c.destroy();
    });
    const hud = this.add
      .text(
        420,
        10,
        `Beans: ${this.beans}/${this.needBeans}  Water: ${this.water}/${this.needWater}`,
        { fontSize: "16px", color: "#e2e8f0" }
      )
      .setDepth(10);
    (hud as any).setDataEnabled();
    (hud as any).setData("hud", true);
  }

  update() {
    // Movement + jump
    const speed = 280;
    const b = this.avatar.body.body as DynBody;

    // horizontal
    this.avatar.body.setVelocityX(0);
    if (this.cursors.left?.isDown) this.avatar.body.setVelocityX(-speed);
    if (this.cursors.right?.isDown) this.avatar.body.setVelocityX(speed);

    // jump (only when grounded)
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      if (b.blocked.down || b.touching.down) b.setVelocityY(-380);
    }

    // Animations
    if (!b.blocked.down && b.velocity.y < -10) this.avatar.play("jump", true);
    else if (!b.blocked.down && b.velocity.y > 10)
      this.avatar.play("fall", true);
    else if (Math.abs(b.velocity.x) > 10) this.avatar.play("run", true);
    else this.avatar.play("idle", true);

    // Despawn off-screen items
    const h = this.scale.height;
    this.items.getChildren().forEach((obj: any) => {
      if (obj.y > h + 24) obj.destroy();
    });
  }
}
