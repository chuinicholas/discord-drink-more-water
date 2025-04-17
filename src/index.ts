import {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  Events,
  Message,
  TextChannel,
  InteractionType,
  ButtonInteraction,
} from "discord.js";
import * as dotenv from "dotenv";
import * as cron from "node-cron";
import {
  getUserData,
  createUser,
  logWater,
  setDailyGoal,
  getDailyProgress,
  updateLastReminded,
  getLeaderboard,
  resetWaterForToday,
} from "./db";
import {
  checkAchievements,
  getUserAchievements,
  getMotivationalMessage,
} from "./rewards";
import {
  formatWaterAmount,
  generateProgressBar,
  createWaterStatusEmbed,
  createWaterLogButtons,
  createLeaderboardEmbed,
  createAchievementsEmbed,
  createReminderEmbed,
  createDashboardEmbed,
  getRandomWaterFact,
} from "./utils";

// Load environment variables
dotenv.config();

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Constants from environment variables
const GIRLFRIEND_USER_ID = process.env.GIRLFRIEND_USER_ID || "";
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || "";
const WATER_CHANNEL_ID = process.env.WATER_CHANNEL_ID || "";

// Log when bot is ready
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  // Initialize users if they don't exist
  if (GIRLFRIEND_USER_ID && !getUserData(GIRLFRIEND_USER_ID)) {
    createUser(GIRLFRIEND_USER_ID, "Girlfriend");
  }

  if (BOT_OWNER_ID && !getUserData(BOT_OWNER_ID)) {
    createUser(BOT_OWNER_ID, "You");
  }

  // Schedule daily goal reset notification and daily challenge
  cron.schedule("0 0 * * *", () => {
    const channel = client.channels.cache.get(WATER_CHANNEL_ID) as TextChannel;
    if (channel) {
      // Generate a random daily water challenge amount between 2000-3000ml
      const challengeAmount = Math.floor(Math.random() * 1000) + 2000;

      channel.send({
        content: `🌞 Good morning <@${GIRLFRIEND_USER_ID}> and <@${BOT_OWNER_ID}>! It's a new day - remember to stay hydrated!`,
        embeds: [
          {
            title: "💧 New Day, New Hydration Goals!",
            description: "Stay hydrated for better health, energy, and mood!",
            color: 0x66ccff,
            fields: [
              {
                name: "🏆 Today's Water Challenge",
                value: `Can you both drink ${formatWaterAmount(
                  challengeAmount
                )} today? Complete the challenge for a hydration achievement!`,
              },
              {
                name: "💡 Water Fact of the Day",
                value: getRandomWaterFact(),
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }
  });

  // Schedule regular reminders every 2 hours from 8AM to 10PM
  cron.schedule("0 8-22/2 * * *", () => {
    // Define users to remind
    const usersToRemind = [
      { id: GIRLFRIEND_USER_ID, name: "Girlfriend" },
      { id: BOT_OWNER_ID, name: "You" },
    ];

    const channel = client.channels.cache.get(WATER_CHANNEL_ID) as TextChannel;
    if (!channel) return;

    // Remind each user if they haven't been reminded recently
    usersToRemind.forEach((userInfo) => {
      if (!userInfo.id) return;

      const user = getUserData(userInfo.id);
      if (user) {
        const lastReminded = new Date(user.lastReminded);
        const now = new Date();
        const hoursSinceLastReminder =
          (now.getTime() - lastReminded.getTime()) / (1000 * 60 * 60);

        // Only remind if it's been more than 1.5 hours
        if (hoursSinceLastReminder > 1.5) {
          const reminderEmbed = createReminderEmbed(userInfo.id, userInfo.name);
          const buttons = createWaterLogButtons();

          channel.send({
            content: `<@${userInfo.id}>`,
            embeds: [reminderEmbed],
            components: [buttons],
          });

          updateLastReminded(userInfo.id);
        }
      }
    });
  });
});

// Button interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // Handle water logging buttons
  if (interaction.customId.startsWith("water_")) {
    const amount = parseInt(interaction.customId.split("_")[1], 10);
    const userId = interaction.user.id;

    // Get or create user
    let user = getUserData(userId);
    if (!user) {
      user = createUser(userId, interaction.user.username);
    }

    // Log water
    logWater(userId, amount);
    const progress = getDailyProgress(userId);

    // Check for achievements if in a text channel
    if (interaction.channel instanceof TextChannel) {
      checkAchievements(userId, interaction.channel);
    }

    // Reply with updated status
    await interaction.reply({
      content: `✅ Added ${formatWaterAmount(amount)}!`,
      embeds: [createWaterStatusEmbed(userId, interaction.user.username)],
      ephemeral: true,
    });

    // Celebrate if goal reached
    if (progress.percentage >= 100 && interaction.channel) {
      interaction.channel.send({
        content: `🎉 Congratulations <@${userId}>! You've reached your daily water goal of ${formatWaterAmount(
          progress.goal
        )}! Keep it up! 🎉\n\n${getMotivationalMessage()}`,
      });
    }
  }
});

// Message handler
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  // Quick command shortcut - just "!" to show quick-add buttons
  if (message.content === "!") {
    const userId = message.author.id;
    let user = getUserData(userId);

    if (!user) {
      user = createUser(userId, message.author.username);
    }

    await message.reply({
      content: "Quick water logging:",
      components: [createWaterLogButtons()],
    });
    return;
  }

  // Process commands
  if (message.content.startsWith("!water")) {
    const args = message.content.split(" ").slice(1);
    const command = args.shift()?.toLowerCase();

    // Get or create user data
    let userId = message.author.id;
    let user = getUserData(userId);

    if (!user) {
      user = createUser(userId, message.author.username);
    }

    switch (command) {
      case "add":
      case "log":
        const amount = parseInt(args[0], 10);
        if (isNaN(amount) || amount <= 0) {
          message.reply(
            "Please provide a valid amount (e.g., `!water add 250`)"
          );
          return;
        }

        logWater(userId, amount);
        const progress = getDailyProgress(userId);

        // Send status with buttons for quick follow-up logging
        await message.reply({
          embeds: [createWaterStatusEmbed(userId, message.author.username)],
          components: [createWaterLogButtons()],
        });

        // Check for achievements
        if (message.channel instanceof TextChannel) {
          checkAchievements(userId, message.channel);
        }

        // Celebrate if goal reached
        if (progress.percentage >= 100) {
          if (message.channel instanceof TextChannel) {
            message.channel.send({
              content: `🎉 Congratulations <@${userId}>! You've reached your daily water goal of ${formatWaterAmount(
                progress.goal
              )}! Keep it up! 🎉\n\n${getMotivationalMessage()}`,
            });
          }
        }
        break;

      case "goal":
        const goal = parseInt(args[0], 10);
        if (isNaN(goal) || goal <= 0) {
          message.reply(
            "Please provide a valid goal in ml (e.g., `!water goal 2000`)"
          );
          return;
        }

        setDailyGoal(userId, goal);
        message.reply({
          embeds: [
            {
              title: "✅ Goal Updated",
              description: `Your daily water goal is now set to ${formatWaterAmount(
                goal
              )}`,
              color: 0x66bbff,
              timestamp: new Date().toISOString(),
            },
          ],
        });
        break;

      case "status":
      case "progress":
        const userToCheck = message.mentions.users.first() || message.author;
        const userToCheckId = userToCheck.id;
        const userData = getUserData(userToCheckId);

        if (!userData) {
          message.reply(
            `${userToCheck.username} hasn't started tracking water consumption yet.`
          );
          return;
        }

        message.reply({
          embeds: [createWaterStatusEmbed(userToCheckId, userToCheck.username)],
          components:
            userToCheckId === message.author.id
              ? [createWaterLogButtons()]
              : [],
        });
        break;

      case "leaderboard":
      case "lb":
        const leaderboard = getLeaderboard();
        message.reply({
          embeds: [createLeaderboardEmbed(leaderboard)],
        });
        break;

      case "achievements":
      case "achieve":
        const achievements = getUserAchievements(userId);
        message.reply({
          embeds: [createAchievementsEmbed(achievements)],
        });
        break;

      case "motivation":
      case "quote":
        message.reply({
          embeds: [
            {
              title: "💪 Stay Motivated!",
              description: getMotivationalMessage(),
              color: 0x66ccff,
              footer: {
                text: "Staying hydrated helps you feel better all day long!",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        });
        break;

      case "fact":
        message.reply({
          embeds: [
            {
              title: "💧 Water Fact",
              description: getRandomWaterFact(),
              color: 0x0099ff,
              timestamp: new Date().toISOString(),
            },
          ],
        });
        break;

      case "quick":
        // Show quick-add buttons only
        await message.reply({
          content: "Quick water logging:",
          components: [createWaterLogButtons()],
        });
        break;

      case "dashboard":
      case "dash":
        // Show a dashboard of all users
        message.reply({
          embeds: [createDashboardEmbed([BOT_OWNER_ID, GIRLFRIEND_USER_ID])],
          components: [createWaterLogButtons()],
        });
        break;

      case "reset":
      case "clear":
        // Reset today's water consumption
        resetWaterForToday(userId);
        message.reply({
          embeds: [
            {
              title: "🔄 Water Consumption Reset",
              description:
                "Your water consumption for today has been reset to 0ml.",
              color: 0xff9966,
              timestamp: new Date().toISOString(),
            },
          ],
        });
        break;

      case "help":
      default:
        // Help message with embed
        message.reply({
          embeds: [
            {
              title: "💧 Water Tracker Commands",
              description: "Keep track of your hydration with these commands:",
              color: 0x0099ff,
              fields: [
                {
                  name: "⚡ Quick Water Logging",
                  value:
                    "`!` - Show quick-add buttons (fastest way!)\n`!water quick` - Quick water logging buttons\n`!water add [amount]` - Log specific amount in ml",
                },
                {
                  name: "🎯 Set Your Goal",
                  value:
                    "`!water goal [amount]` - Set your daily water goal in ml\n*Example: `!water goal 2000`*",
                },
                {
                  name: "📊 Track Progress",
                  value:
                    "`!water dashboard` - See everyone's progress at once\n`!water status [@user]` - Check your or another user's hydration status",
                },
                {
                  name: "🏆 Compare & Compete",
                  value: "`!water leaderboard` - See the hydration leaderboard",
                },
                {
                  name: "🏅 Track Achievements",
                  value:
                    "`!water achievements` - View your unlocked achievements",
                },
                {
                  name: "💪 Stay Motivated",
                  value:
                    "`!water motivation` - Get a motivational message\n`!water fact` - Learn an interesting water fact",
                },
                {
                  name: "🔄 Reset Progress",
                  value:
                    "`!water reset` - Reset your water consumption for today to 0ml",
                },
              ],
              footer: {
                text: "Stay hydrated! 💦",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        });
    }
  }
});

// External function to send direct reminders
export const sendDirectReminder = async (userId: string): Promise<void> => {
  try {
    const user = client.users.cache.get(userId);
    if (user) {
      const reminderEmbed = createReminderEmbed(userId, user.username);
      const buttons = createWaterLogButtons();

      await user.send({
        embeds: [reminderEmbed],
        components: [buttons],
      });

      updateLastReminded(userId);
    }
  } catch (error) {
    console.error(`Failed to send reminder to user ${userId}:`, error);
  }
};

// Login to Discord with the token
client.login(process.env.DISCORD_TOKEN);
