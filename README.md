# Discord Drink More Water Bot

A Discord bot designed to help track water consumption and provide reminders to drink water throughout the day, with a beautiful and engaging UI.

![Water Bot](https://via.placeholder.com/800x400?text=Water+Tracker+Bot)

## Features

- 💧 Track daily water consumption with interactive buttons
- 🎯 Set personalized daily water intake goals
- 📊 View your hydration progress with visual indicators
- ⏰ Receive periodic reminders to drink water
- 🏆 Leaderboard system to compare hydration levels
- 🏅 Achievement system to motivate consistent hydration
- 💪 Motivational messages to encourage healthy habits
- 🧠 Water facts to educate about hydration benefits
- 🎮 Interactive UI with buttons for quick water logging

## Commands

- `!water add [amount]` - Log water consumption in ml (e.g., `!water add 250`)
- `!water goal [amount]` - Set your daily water goal in ml (e.g., `!water goal 2000`)
- `!water status [@user]` - Check your or another user's hydration status
- `!water leaderboard` - See the hydration leaderboard
- `!water achievements` - View your unlocked achievements
- `!water motivation` - Get a motivational message
- `!water fact` - Learn an interesting water fact
- `!water help` - See all available commands

## Interactive UI

The bot features an interactive UI with:

- **Quick Add Buttons**: Add 100ml, 250ml, 500ml or 1L with a single click
- **Visual Progress Bars**: See your progress with colorful indicators
- **Rich Embeds**: All information is displayed in beautiful, formatted embeds
- **Color Coding**: Different colors indicate progress levels
- **Achievement Badges**: Visual indicators of your hydration milestones

## Achievements

The bot includes several achievements to gamify water consumption:

- 🥤 **First Sip** - Log your first glass of water
- 🏆 **Goal Crusher** - Reach your daily water goal
- 🔥 **Hydration Streak** - Meet your daily water goal for 3 days in a row
- 💯 **Hydration Master** - Meet your daily water goal for 7 days in a row
- 🐳 **Big Gulp** - Drink at least 500ml of water in one go

## Reminders

The bot sends smart reminders:

- **Morning Message**: Start each day with a fresh hydration goal
- **Periodic Reminders**: Get gentle reminders throughout the day
- **Smart Timing**: Only sends reminders when you haven't had water in a while
- **Custom Tips**: Each reminder includes a unique hydration tip
- **Progress Updates**: See your current progress with each reminder

## Setup

1. **Create a Discord Bot**

   - Visit the [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application and set up a bot
   - Enable necessary intents (Server Members, Message Content)
   - Add these bot permissions: Read Messages/View Channels, Send Messages, Send Messages in Threads, Embed Links, Mention Everyone, Read Message History, Add Reactions, Use External Emojis
   - Copy your bot token

2. **Configure Environment Variables**

   - Rename `.env.example` to `.env`
   - Add your Discord bot token
   - Add the user IDs for you and your girlfriend
   - Add the channel ID for sending reminders

3. **Install Dependencies**

   ```
   npm install
   ```

4. **Build and Run the Bot**

   ```
   npm run build
   npm start
   ```

   For development:

   ```
   npm run dev
   ```

5. **Invite the Bot to Your Server**
   - Generate an invite link from the Discord Developer Portal
   - Use the link to add the bot to your server

## Development

This project is built with:

- TypeScript
- Discord.js
- node-cron for scheduling
- lowdb for simple data storage
