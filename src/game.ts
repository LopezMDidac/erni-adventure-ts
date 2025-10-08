import Phaser from "phaser";
import { Boot } from "@/scenes/Boot";
import { MainMenu } from "@/scenes/MainMenu";
import { LevelSelect } from "@/scenes/LevelSelect";
import { Results } from "@/scenes/Results";
import { Cutscene } from "@/scenes/Cutscene";
import { Leaderboard } from "@/scenes/Leaderboard";
import { AvatarCreator } from "@/scenes/creator/AvatarCreator";

// Chapters
import { Ch1AccessDenied } from "@/scenes/chapters/Ch1AccessDenied";
import { Ch2HRInterception } from "@/scenes/chapters/Ch2HRInterception";
import { Ch3DeskDrama } from "@/scenes/chapters/Ch3DeskDrama";
import { Ch4TechTrouble } from "@/scenes/chapters/Ch4TechTrouble";
import { Ch5CoffeeQuest } from "@/scenes/chapters/Ch5CoffeeQuest";
import { Ch6MeetingMayhem } from "@/scenes/chapters/Ch6MeetingMayhem";
import { Ch7ChurroRush } from "@/scenes/chapters/Ch7ChurroRush";
import { Ch8ColdOffice } from "@/scenes/chapters/Ch8ColdOffice";

export function createGame() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    backgroundColor: "#1e293b",
    dom: { createContainer: true },
    scale: {
      parent: "game-root",
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false, gravity: { y: 1000 } },
    },
    scene: [
      Boot,
      MainMenu,
      LevelSelect,
      Cutscene,
      Results,
      Leaderboard,
      AvatarCreator,
      Ch1AccessDenied,
      Ch2HRInterception,
      Ch3DeskDrama,
      Ch4TechTrouble,
      Ch5CoffeeQuest,
      Ch6MeetingMayhem,
      Ch7ChurroRush,
      Ch8ColdOffice,
    ],
  });
  return game;
}
