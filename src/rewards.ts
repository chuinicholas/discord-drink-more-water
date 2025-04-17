import { TextChannel } from "discord.js";
import { getUserData } from "./db";

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  isUnlocked: (userId: string) => boolean;
}

// List of achievements
export const achievements: Achievement[] = [
  {
    id: "first_glass",
    name: "First Sip",
    description: "Log your first glass of water",
    emoji: "🥤",
    isUnlocked: (userId: string) => {
      const user = getUserData(userId);
      if (!user) return false;

      // Check if they've ever logged water
      return Object.values(user.waterLog).some((day) => day.amount > 0);
    },
  },
  {
    id: "daily_goal",
    name: "Goal Crusher",
    description: "Reach your daily water goal",
    emoji: "🏆",
    isUnlocked: (userId: string) => {
      const user = getUserData(userId);
      if (!user) return false;

      const today = new Date().toISOString().split("T")[0];
      return user.waterLog[today]?.amount >= user.dailyGoal;
    },
  },
  {
    id: "streak_3",
    name: "Hydration Streak",
    description: "Meet your daily water goal for 3 days in a row",
    emoji: "🔥",
    isUnlocked: (userId: string) => {
      const user = getUserData(userId);
      if (!user) return false;

      return user.streakDays >= 3;
    },
  },
  {
    id: "streak_7",
    name: "Hydration Master",
    description: "Meet your daily water goal for 7 days in a row",
    emoji: "💯",
    isUnlocked: (userId: string) => {
      const user = getUserData(userId);
      if (!user) return false;

      return user.streakDays >= 7;
    },
  },
  {
    id: "big_gulp",
    name: "Big Gulp",
    description: "Drink at least 500ml of water in one go",
    emoji: "🐳",
    isUnlocked: (userId: string) => {
      const user = getUserData(userId);
      if (!user) return false;

      // Check if any single entry is 500ml or more
      return Object.values(user.waterLog).some((day) =>
        day.entries.some((entry) => entry.amount >= 500)
      );
    },
  },
];

// User achievements storage
const userAchievements: Record<string, string[]> = {};

// Check for new achievements
export const checkAchievements = (
  userId: string,
  channel: TextChannel
): void => {
  // Initialize user achievement array if it doesn't exist
  if (!userAchievements[userId]) {
    userAchievements[userId] = [];
  }

  // Check each achievement
  for (const achievement of achievements) {
    // Skip if already unlocked
    if (userAchievements[userId].includes(achievement.id)) {
      continue;
    }

    // Check if achievement should be unlocked
    if (achievement.isUnlocked(userId)) {
      // Add to unlocked achievements
      userAchievements[userId].push(achievement.id);

      // Send achievement unlock message
      channel.send(
        `🎊 **ACHIEVEMENT UNLOCKED** 🎊\n\n${achievement.emoji} **${achievement.name}**: ${achievement.description}\n\nCongratulations <@${userId}>!`
      );
    }
  }
};

// Get all achievements for a user with unlock status
export const getUserAchievements = (
  userId: string
): Array<Achievement & { unlocked: boolean }> => {
  // Initialize if needed
  if (!userAchievements[userId]) {
    userAchievements[userId] = [];
  }

  return achievements.map((achievement) => ({
    ...achievement,
    unlocked: userAchievements[userId].includes(achievement.id),
  }));
};

// Generate motivational messages
export const getMotivationalMessage = (): string => {
  const messages = [
    "Drinking water is self-care! Keep it up! 💖",
    "Hydration is key to feeling your best today! 💪",
    "Your future self thanks you for drinking water now. 🔮",
    "Every sip is a step towards better health! 👣",
    "You're doing great! Keep that water flowing! 🌊",
    "Staying hydrated improves your mood and energy! ⚡",
    "Water is the best beauty treatment! ✨",
    "Being hydrated helps you think more clearly! 🧠",
    "Your body loves you for drinking water! ❤️",
    "You're crushing these hydration goals! 🏆",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};
