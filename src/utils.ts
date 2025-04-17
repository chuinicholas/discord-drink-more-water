import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getUserData, getDailyProgress } from "./db";

// Format water amount for display
export const formatWaterAmount = (amount: number): string => {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}L`;
  }
  return `${amount}ml`;
};

// Generate progress bar with emojis
export const generateProgressBar = (percentage: number): string => {
  const barLength = 10;
  const filledLength = Math.floor((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;

  const filled = "🟦".repeat(filledLength);
  const empty = "⬜".repeat(emptyLength);

  return filled + empty;
};

// Get emoji for water reminders based on completion percentage
export const getWaterEmoji = (percentage: number): string => {
  if (percentage === 0) return "🏜️"; // desert
  if (percentage < 25) return "💧"; // droplet
  if (percentage < 50) return "🚰"; // potable water
  if (percentage < 75) return "🥤"; // cup with straw
  if (percentage < 100) return "🌊"; // water wave
  return "🌈"; // rainbow for 100%
};

// Get color based on progress percentage
export const getProgressColor = (percentage: number): number => {
  if (percentage < 25) return 0xff6666; // light red
  if (percentage < 50) return 0xffcc66; // orange
  if (percentage < 75) return 0x66ccff; // light blue
  if (percentage < 100) return 0x66bbff; // blue
  return 0x66ffcc; // teal for 100%
};

// Create an embed for water status
export const createWaterStatusEmbed = (
  userId: string,
  username: string
): EmbedBuilder => {
  const user = getUserData(userId);
  const progress = getDailyProgress(userId);

  const embed = new EmbedBuilder()
    .setColor(getProgressColor(progress.percentage))
    .setTitle(
      `${getWaterEmoji(progress.percentage)} ${username}'s Hydration Status`
    )
    .setDescription(`Stay hydrated for better health and productivity!`)
    .addFields(
      {
        name: "💧 Today's Progress",
        value: `${formatWaterAmount(progress.current)} / ${formatWaterAmount(
          progress.goal
        )}`,
        inline: true,
      },
      { name: "📊 Completion", value: `${progress.percentage}%`, inline: true },
      {
        name: "🔥 Streak",
        value: `${user?.streakDays || 0} day(s)`,
        inline: true,
      },
      {
        name: "📈 Progress Bar",
        value: generateProgressBar(progress.percentage),
        inline: false,
      }
    )
    .setFooter({ text: `${getRandomWaterTip()}` })
    .setTimestamp();

  if (progress.percentage >= 100) {
    embed.addFields({
      name: "🎉 Goal Achieved!",
      value: "Congratulations on reaching your water goal today!",
      inline: false,
    });
  } else {
    const remaining = progress.goal - progress.current;
    embed.addFields({
      name: "🚰 Remaining",
      value: `${formatWaterAmount(
        remaining > 0 ? remaining : 0
      )} to reach your goal`,
      inline: false,
    });
  }

  return embed;
};

// Create quick add buttons for water logging
export const createWaterLogButtons = (): ActionRowBuilder<ButtonBuilder> => {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("water_100")
      .setLabel("100ml")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("💧"),
    new ButtonBuilder()
      .setCustomId("water_250")
      .setLabel("250ml")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🥤"),
    new ButtonBuilder()
      .setCustomId("water_500")
      .setLabel("500ml")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🍶"),
    new ButtonBuilder()
      .setCustomId("water_1000")
      .setLabel("1L")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🫗")
  );

  return row;
};

// Create a leaderboard embed
export const createLeaderboardEmbed = (
  leaderboardData: Array<{ name: string; amount: number; percentage: number }>
): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("🏆 Hydration Leaderboard")
    .setDescription("Who's drinking the most water today?")
    .setTimestamp();

  if (leaderboardData.length === 0) {
    embed.addFields({
      name: "No data yet",
      value: "Start tracking your water intake to appear on the leaderboard!",
      inline: false,
    });
    return embed;
  }

  // Add medal emojis for top 3
  const medals = ["🥇", "🥈", "🥉"];

  leaderboardData.forEach((entry, index) => {
    const prefix = index < 3 ? medals[index] : `${index + 1}.`;
    embed.addFields({
      name: `${prefix} ${entry.name}`,
      value: `${formatWaterAmount(entry.amount)} (${
        entry.percentage
      }%)\n${generateProgressBar(entry.percentage)}`,
      inline: false,
    });
  });

  return embed;
};

// Get a random water fact
export const getRandomWaterFact = (): string => {
  const facts = [
    "Your brain is 73% water, and even mild dehydration can impair cognitive function.",
    "Drinking water can help you lose weight by increasing metabolism and reducing appetite.",
    "Proper hydration helps maintain the balance of bodily fluids that aid digestion and circulation.",
    "Being dehydrated by just 2% can cause fatigue and impair physical performance.",
    "Water helps regulate body temperature through sweating and respiration.",
    "Drinking enough water can help prevent kidney stones and urinary tract infections.",
    "Water carries nutrients to cells and helps remove waste products from the body.",
    "About 60% of your body is made up of water.",
    "The recommended daily water intake is about 2.7 liters for women and 3.7 liters for men.",
    "Room temperature water is better for hydration than cold water because it's easier for your body to absorb.",
    "Caffeinated drinks like coffee and tea can contribute to hydration, but water is still best.",
    "Feeling thirsty is actually a sign that you're already dehydrated.",
    "Water helps maintain skin elasticity and can improve the appearance of your skin.",
    "Joint cartilage contains up to 80% water, so staying hydrated helps protect your joints.",
    "Drinking water when you first wake up helps activate your internal organs.",
  ];

  return facts[Math.floor(Math.random() * facts.length)];
};

// Get a random water tip
export const getRandomWaterTip = (): string => {
  const tips = [
    "Try adding a slice of lemon or lime to your water for flavor!",
    "Carry a water bottle with you to encourage regular sipping.",
    "Set reminders on your phone to drink water throughout the day.",
    "Drink a glass of water before each meal to help with digestion.",
    "Replace one sugary drink with water each day for better health.",
    "Try herbal tea as a tasty way to increase your fluid intake.",
    "Eat water-rich fruits and vegetables to boost hydration.",
    "Track your water intake using this bot for better awareness!",
    "Drink a glass of water when you wake up to rehydrate after sleep.",
    "Take water breaks during work to stay focused and hydrated.",
  ];

  return tips[Math.floor(Math.random() * tips.length)];
};

// Create an embed for achievements
export const createAchievementsEmbed = (
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    emoji: string;
    unlocked: boolean;
  }>
): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setColor(0x9966ff)
    .setTitle("🏅 Water Drinking Achievements")
    .setDescription("Complete these achievements to become a hydration master!")
    .setTimestamp();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  embed.setFooter({
    text: `You've unlocked ${unlockedCount}/${achievements.length} achievements!`,
  });

  achievements.forEach((achievement) => {
    const status = achievement.unlocked ? "✅" : "❌";
    embed.addFields({
      name: `${status} ${achievement.emoji} ${achievement.name}`,
      value: achievement.description,
      inline: false,
    });
  });

  return embed;
};

// Create reminder embed
export const createReminderEmbed = (
  userId: string,
  username: string
): EmbedBuilder => {
  const progress = getDailyProgress(userId);
  const remaining = progress.goal - progress.current;

  const embed = new EmbedBuilder()
    .setColor(getProgressColor(progress.percentage))
    .setTitle(`${getWaterEmoji(progress.percentage)} Water Reminder!`)
    .setDescription(`<@${userId}>, it's time to drink some water!`)
    .addFields(
      {
        name: "💧 Current Progress",
        value: `${formatWaterAmount(progress.current)} / ${formatWaterAmount(
          progress.goal
        )} (${progress.percentage}%)`,
        inline: false,
      },
      {
        name: "📈 Progress Bar",
        value: generateProgressBar(progress.percentage),
        inline: false,
      },
      {
        name: "🚰 Remaining",
        value: `${formatWaterAmount(
          remaining > 0 ? remaining : 0
        )} to reach your goal`,
        inline: false,
      },
      { name: "💡 Tip", value: getRandomWaterTip(), inline: false }
    )
    .setTimestamp();

  return embed;
};

// Create a dashboard embed showing all users' progress
export const createDashboardEmbed = (userIds: string[]): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("💧 Hydration Dashboard")
    .setDescription("Track everyone's water drinking progress")
    .setTimestamp();

  // Get the current date
  const today = new Date().toISOString().split("T")[0];

  // Add each user's progress
  userIds.forEach((userId) => {
    const user = getUserData(userId);
    if (!user) return;

    const progress = getDailyProgress(userId);

    embed.addFields({
      name: `${getWaterEmoji(progress.percentage)} ${user.name}`,
      value: `${formatWaterAmount(progress.current)} / ${formatWaterAmount(
        progress.goal
      )} (${progress.percentage}%)\n${generateProgressBar(
        progress.percentage
      )}\n🔥 Streak: ${user.streakDays} day(s)`,
      inline: false,
    });
  });

  // Add footer with tip
  embed.setFooter({ text: getRandomWaterTip() });

  return embed;
};
