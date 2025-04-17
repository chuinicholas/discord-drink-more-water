import * as fs from "fs";
import * as path from "path";
// @ts-ignore
const lowdb = require("lowdb");
// @ts-ignore
const FileSync = require("lowdb/adapters/FileSync");

// Define our database schema
export interface User {
  id: string;
  name: string;
  dailyGoal: number; // in ml
  streakDays: number;
  waterLog: {
    [date: string]: {
      amount: number; // in ml
      entries: Array<{ time: string; amount: number }>;
    };
  };
  lastReminded: string;
}

interface Schema {
  users: User[];
}

// Make sure the data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Set up lowdb
const adapter = new FileSync(path.join(dataDir, "water-data.json"));
const db = lowdb(adapter);

// Initialize database with default data
db.defaults({ users: [] }).write();

export default db;

// Helper functions for water tracking
export const getUserData = (userId: string): User | undefined => {
  return db.get("users").find({ id: userId }).value();
};

export const createUser = (userId: string, name: string): User => {
  const today = new Date().toISOString().split("T")[0];
  const newUser: User = {
    id: userId,
    name,
    dailyGoal: 2000, // Default: 2 liters (2000ml)
    streakDays: 0,
    waterLog: {
      [today]: {
        amount: 0,
        entries: [],
      },
    },
    lastReminded: new Date().toISOString(),
  };

  db.get("users").push(newUser).write();

  return newUser;
};

export const logWater = (userId: string, amount: number): void => {
  const user = getUserData(userId);
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  if (!user) return;

  // Initialize today's log if it doesn't exist
  if (!user.waterLog[today]) {
    user.waterLog[today] = {
      amount: 0,
      entries: [],
    };
  }

  // Update the water log
  user.waterLog[today].amount += amount;
  user.waterLog[today].entries.push({
    time: now,
    amount,
  });

  // Check if the user has met their daily goal and update streak
  if (user.waterLog[today].amount >= user.dailyGoal) {
    // Check if yesterday's goal was also met to continue the streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (
      user.waterLog[yesterdayStr] &&
      user.waterLog[yesterdayStr].amount >= user.dailyGoal
    ) {
      user.streakDays += 1;
    } else if (!user.waterLog[yesterdayStr]) {
      // If this is a new day and there's no yesterday log, still increment
      user.streakDays += 1;
    }
  }

  // Save changes to db
  db.write();
};

export const setDailyGoal = (userId: string, goal: number): void => {
  db.get("users").find({ id: userId }).assign({ dailyGoal: goal }).write();
};

export const getDailyProgress = (
  userId: string
): { current: number; goal: number; percentage: number } => {
  const user = getUserData(userId);
  if (!user) return { current: 0, goal: 0, percentage: 0 };

  const today = new Date().toISOString().split("T")[0];
  const current = user.waterLog[today]?.amount || 0;
  const percentage = Math.min(
    100,
    Math.floor((current / user.dailyGoal) * 100)
  );

  return {
    current,
    goal: user.dailyGoal,
    percentage,
  };
};

export const updateLastReminded = (userId: string): void => {
  db.get("users")
    .find({ id: userId })
    .assign({ lastReminded: new Date().toISOString() })
    .write();
};

export const getLeaderboard = (): Array<{
  name: string;
  amount: number;
  percentage: number;
}> => {
  const users = db.get("users").value();
  const today = new Date().toISOString().split("T")[0];

  return (
    users
      .map((user: User) => {
        const current = user.waterLog[today]?.amount || 0;
        const percentage = Math.min(
          100,
          Math.floor((current / user.dailyGoal) * 100)
        );

        return {
          name: user.name,
          amount: current,
          percentage,
        };
      })
      // Filter out users with no water logged today
      .filter((entry) => entry.amount > 0)
      .sort(
        (a: { percentage: number }, b: { percentage: number }) =>
          b.percentage - a.percentage
      )
  );
};

// Reset water consumption for today
export const resetWaterForToday = (userId: string): void => {
  const user = getUserData(userId);
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];

  // Reset today's log if it exists
  if (user.waterLog[today]) {
    user.waterLog[today] = {
      amount: 0,
      entries: [],
    };
  }

  // Save changes to db
  // @ts-ignore
  db.write();
};
