// src/scenes/chapters/Ch4TechTrouble.ts
import Phaser from "phaser";
import sample from "@/data/puzzles/easy1.json";
import { loadSave, saveSave, unlockLevel } from "@/systems/save";
import { createPaperDollAvatar } from "@/avatar/AvatarPaperDoll";

type Cell = { r: number; c: number; rot: number; type: string };

export class Ch4TechTrouble extends Phaser.Scene {
  private grid: Cell[][] = [];
  private gridC!: Phaser.GameObjects.Container;
  private size = 5;
  private cellW = 64;
  private cellH = 64;
  private hudC!: Phaser.GameObjects.Container;

  // Required cells for the target lowercase "e" (5×5)
  // rot is in 90° steps: 0=right/up, 1=down/right, 2=left/down, 3=up/left
  // For straight: rot 0=horizontal, 1=vertical (2/3 are equivalent visually)
  private E_REQUIREMENTS: Record<
    string,
    { type: "straight" | "elbow"; rot: number }
  > = {
    // top bar
    "0,1": { type: "elbow", rot: 1 },
    "0,2": { type: "straight", rot: 0 },
    "0,3": { type: "elbow", rot: 2 }, // turn from left → down
    // vertical spine
    "1,1": { type: "straight", rot: 1 },
    "1,3": { type: "straight", rot: 1 },
    // middle bar
    "2,1": { type: "straight", rot: 1 },
    "2,2": { type: "straight", rot: 0 },
    "2,3": { type: "elbow", rot: 3 }, // turn from left → down (gives that “e” hint)

    "3,1": { type: "straight", rot: 1 },
    // bottom bar
    "4,1": { type: "elbow", rot: 0 },
    "4,2": { type: "straight", rot: 0 },
    "4,3": { type: "straight", rot: 0 },
  };

  constructor() {
    super("Ch4TechTrouble");
  }

  create() {
    const { width } = this.scale;

    // HUD
    this.hudC = this.add.container(0, 0);
    const title = this.add
      .text(width / 2, 40, "Ch4: Tech Trouble (Cables Puzzle)", {
        fontSize: "24px",
        color: "#e2e8f0",
      })
      .setOrigin(0.5);
    const instr = this.add
      .text(width / 2, 420, "Gira las piezas para dibujar una “e” minúscula.", {
        fontSize: "16px",
        color: "#93c5fd",
      })
      .setOrigin(0.5);
    this.hudC.add([title, instr]);

    // Board container
    this.gridC = this.add.container(0, 0);

    // Load puzzle data
    this.grid = (sample.grid as any as Cell[][]).map((row, r) =>
      row.map((cell, c) => ({
        r,
        c,
        rot: cell.rot ?? 0,
        type: cell.type ?? "elbow",
      }))
    );
    this.size = this.grid.length;

    // Make sure required cells have the right PIECE TYPE for drawing an "e"
    this.applyELayout();

    // Decorative avatar — no gravity so it stays put
    const avatar = createPaperDollAvatar(this, 200, 240, loadSave().avatar, {
      width: 180,
      height: 240,
    });
    const ab = avatar.body.body as Phaser.Physics.Arcade.Body;
    ab.setAllowGravity(false).setImmovable(true).setVelocity(0, 0);
    avatar.play("idle", true);

    // Draw board
    this.buildGrid();
  }

  /** Ensure required cells use types that can form a lowercase 'e'. Randomize their initial rotation. */
  private applyELayout() {
    Object.entries(this.E_REQUIREMENTS).forEach(([key, req]) => {
      const [rStr, cStr] = key.split(",");
      const r = Number(rStr),
        c = Number(cStr);
      const cell = this.grid[r][c];
      cell.type = req.type; // force required piece type
      // randomize initial rotation so the user has to solve it
      const wrong = [0, 1, 2, 3].filter((v) => v !== req.rot);
      cell.rot = wrong[Phaser.Math.Between(0, wrong.length - 1)];
      cell.rot = 0;
    });
  }

  private buildGrid() {
    this.gridC.removeAll(true);
    const startX = (this.scale.width - this.size * this.cellW) / 2;
    const startY = 80;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = startX + c * this.cellW + this.cellW / 2;
        const y = startY + r * this.cellH + this.cellH / 2;
        const cell = this.grid[r][c];

        const tile = this.add.container(x, y);

        // cell background
        const bg = this.add
          .rectangle(0, 0, this.cellW - 4, this.cellH - 4, 0x1f2937)
          .setStrokeStyle(2, 0x334155)
          .setInteractive({ useHandCursor: true });
        tile.add(bg);

        // sub-container we rotate
        const wireC = this.add.container(0, 0);
        tile.add(wireC);

        const gfx = this.add.graphics();
        wireC.add(gfx);

        (tile as any).setDataEnabled();
        (tile as any).setData("r", r);
        (tile as any).setData("c", c);
        (tile as any).setData("gfx", gfx);
        (tile as any).setData("wireC", wireC);

        bg.on("pointerup", () => {
          cell.rot = (cell.rot + 1) % 4;
          this.drawTile(tile, cell);
          this.checkWin();
        });

        this.drawTile(tile, cell);
        this.gridC.add(tile);
      }
    }
  }

  private drawTile(tile: Phaser.GameObjects.Container, cell: Cell) {
    const gfx = (tile as any).getData("gfx") as Phaser.GameObjects.Graphics;
    const wireC = (tile as any).getData(
      "wireC"
    ) as Phaser.GameObjects.Container;

    gfx.clear();
    gfx.lineStyle(4, 0x93c5fd, 1);

    const len = this.cellW / 2 - 14;

    if (cell.type === "straight") {
      // Draw a straight line centered at (0,0), horizontal at rot=0
      gfx.beginPath();
      gfx.moveTo(-len, 0);
      gfx.lineTo(len, 0);
      gfx.strokePath();
      gfx.fillStyle(0x93c5fd, 1);
      gfx.fillCircle(0, 0, 3);
      wireC.rotation = Phaser.Math.DegToRad((cell.rot % 2) * 90); // 0 or 90 only
    } else if (cell.type === "elbow") {
      // Base elbow: to the right (east) and up (north)
      gfx.beginPath();
      gfx.moveTo(0, 0);
      gfx.lineTo(len, 0);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(0, 0);
      gfx.lineTo(0, -len);
      gfx.strokePath();

      gfx.fillStyle(0x93c5fd, 1);
      gfx.fillCircle(0, 0, 3);
      wireC.rotation = Phaser.Math.DegToRad((cell.rot % 4) * 90);
    } else {
      // unknown/blank: do nothing (keeps the dark tile)
    }
  }

  private checkWin() {
    // Success when ALL required cells match the exact (type, rot)
    const ok = Object.entries(this.E_REQUIREMENTS).every(([key, req]) => {
      const [rStr, cStr] = key.split(",");
      const r = Number(rStr),
        c = Number(cStr);
      const cell = this.grid[r][c];

      if (req.type !== cell.type) return false;
      if (req.type === "straight") {
        // straight visually repeats every 180°; accept 0/2 as horizontal, 1/3 as vertical
        const expectedParity = req.rot % 2;
        return cell.rot % 2 === expectedParity;
      } else {
        return cell.rot % 4 === req.rot % 4;
      }
    });

    if (ok) {
      const data = loadSave();
      unlockLevel(data, "Ch5CoffeeQuest");
      saveSave(data);
      this.scene.start("Results", {
        title: "¡Monitores online!",
        subtitle: "Has cableado una “e”.",
        unlock: "Ch5CoffeeQuest",
        sourceLevel: "Ch4TechTrouble",
      });
    }
  }
}
