import { relations } from "drizzle-orm";
import {
  users,
  profiles,
  notificationPrefs,
  locations,
  seasons,
  weeks,
  optIns,
  matchups,
  matchupPlayers,
  games,
  gameScores,
  scheduledGames,
  announcements,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  notificationPrefs: one(notificationPrefs, {
    fields: [users.id],
    references: [notificationPrefs.userId],
  }),
  homeLocation: one(locations, {
    fields: [users.homeLocationId],
    references: [locations.id],
  }),
  matchupPlayers: many(matchupPlayers),
  optIns: many(optIns),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  weeks: many(weeks),
}));

export const weeksRelations = relations(weeks, ({ one, many }) => ({
  season: one(seasons, { fields: [weeks.seasonId], references: [seasons.id] }),
  matchups: many(matchups),
  optIns: many(optIns),
}));

export const optInsRelations = relations(optIns, ({ one }) => ({
  user: one(users, { fields: [optIns.userId], references: [users.id] }),
  week: one(weeks, { fields: [optIns.weekId], references: [weeks.id] }),
}));

export const matchupsRelations = relations(matchups, ({ one, many }) => ({
  week: one(weeks, { fields: [matchups.weekId], references: [weeks.id] }),
  location: one(locations, {
    fields: [matchups.locationId],
    references: [locations.id],
  }),
  players: many(matchupPlayers),
  games: many(games),
  scheduledGame: one(scheduledGames, {
    fields: [matchups.id],
    references: [scheduledGames.matchupId],
  }),
}));

export const matchupPlayersRelations = relations(matchupPlayers, ({ one }) => ({
  matchup: one(matchups, {
    fields: [matchupPlayers.matchupId],
    references: [matchups.id],
  }),
  user: one(users, { fields: [matchupPlayers.userId], references: [users.id] }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  matchup: one(matchups, { fields: [games.matchupId], references: [matchups.id] }),
  scores: many(gameScores),
}));

export const gameScoresRelations = relations(gameScores, ({ one }) => ({
  game: one(games, { fields: [gameScores.gameId], references: [games.id] }),
  user: one(users, { fields: [gameScores.userId], references: [users.id] }),
}));

export const scheduledGamesRelations = relations(scheduledGames, ({ one }) => ({
  matchup: one(matchups, {
    fields: [scheduledGames.matchupId],
    references: [matchups.id],
  }),
  location: one(locations, {
    fields: [scheduledGames.locationId],
    references: [locations.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, { fields: [announcements.authorId], references: [users.id] }),
}));
