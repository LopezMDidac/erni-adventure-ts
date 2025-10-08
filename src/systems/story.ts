export const NextSceneFor: Record<string, string> = {
  "intro": "AvatarCreator",
  "ch1": "Ch1AccessDenied",
  "ch2": "Ch2HRInterception",
  "ch3": "Ch3DeskDrama",
  "ch4": "Ch4TechTrouble",
  "ch5": "Ch5CoffeeQuest",
  "ch6": "Ch6MeetingMayhem",
  "ch7": "Ch7ChurroRush",
  "ch8": "Ch8ColdOffice",
  "conclusion": "Leaderboard"
};

export const NextCutsceneAfterLevel: Record<string, string> = {
  "Ch1AccessDenied": "ch2",
  "Ch2HRInterception": "ch3",
  "Ch3DeskDrama": "ch4",
  "Ch4TechTrouble": "ch5",
  "Ch5CoffeeQuest": "ch6",
  "Ch6MeetingMayhem": "ch7",
  "Ch7ChurroRush": "ch8",
  "Ch8ColdOffice": "conclusion"
};
