import * as fs from "fs";
import * as path from "path";
import { POINTS_FILE, TARGET_EMOJI } from "./constants";

export interface UserPoints {
  userId: string;
  username: string;
  points: number;
}

export class PointManager {
  private pointsPath: string;
  private points: Map<string, UserPoints>;

  constructor() {
    this.pointsPath = path.join(process.cwd(), POINTS_FILE);
    this.points = new Map();
    this.load();
  }

  private load() {
    if (fs.existsSync(this.pointsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.pointsPath, "utf-8"));
        this.points = new Map(Object.entries(data));
      } catch (error) {
        console.error("Failed to load points data:", error);
        this.points = new Map();
      }
    }
  }

  private save() {
    try {
      const pointsData = Object.fromEntries(this.points);
      fs.writeFileSync(this.pointsPath, JSON.stringify(pointsData, null, 2));
    } catch (error) {
      console.error("Failed to save points data:", error);
    }
  }

  addPoint(userId: string, username: string, amount: number = 1) {
    const user = this.points.get(userId) || {
      userId,
      username,
      points: 0,
    };
    user.points += amount;
    user.username = username;
    this.points.set(userId, user);
    this.save();
  }

  removePoint(userId: string, username: string, amount: number = 1) {
    const user = this.points.get(userId) || {
      userId,
      username,
      points: 0,
    };
    user.points = Math.max(0, user.points - amount);
    user.username = username;
    this.points.set(userId, user);
    this.save();
  }

  getPoints(userId: string): number {
    return this.points.get(userId)?.points || 0;
  }

  getRanking(limit: number = 10): UserPoints[] {
    return Array.from(this.points.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  isTargetEmoji(emoji: string): boolean {
    return emoji === TARGET_EMOJI;
  }
}