import {
  pgTable,
  pgEnum,
  text,
  uuid,
  integer,
  serial,
  smallint,
  boolean,
  timestamp,
  jsonb,
  date,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ----------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */
export const leagueEnum = pgEnum("league", ["competitive", "casual"]);
export const roleEnum = pgEnum("role", ["player", "admin"]);
export const weekStatusEnum = pgEnum("week_status", [
  "pending", // not generated yet
  "preview", // generated, awaiting admin review / auto-publish
  "published", // visible to players, notifications sent
  "completed", // scores in, week closed
]);
export const scheduleStatusEnum = pgEnum("schedule_status", [
  "unscheduled",
  "proposed",
  "confirmed",
]);
export const availabilitySourceEnum = pgEnum("availability_source", [
  "manual",
  "outlook", // reserved for future Microsoft Graph import
]);
export const notificationCategoryEnum = pgEnum("notification_category", [
  "pairings",
  "schedule",
  "score_reminders",
  "game_reminders",
  "auth",
]);
export const notificationStatusEnum = pgEnum("notification_status", ["sent", "failed"]);

/* ----------------------------------------------------------------------------
 * Auth.js core tables (+ league-specific player columns on users)
 * ------------------------------------------------------------------------- */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // League-specific
  league: leagueEnum("league").notNull().default("competitive"),
  role: roleEnum("role").notNull().default("player"),
  homeLocationId: integer("home_location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(), // holds the 6-digit OTP code
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ----------------------------------------------------------------------------
 * Profiles & preferences
 * ------------------------------------------------------------------------- */
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  prefs: jsonb("prefs").$type<Record<string, unknown>>().default({}),
});

export const notificationPrefs = pgTable("notification_prefs", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  pairings: boolean("pairings").notNull().default(true),
  schedule: boolean("schedule").notNull().default(true),
  scoreReminders: boolean("score_reminders").notNull().default(true),
  gameReminders: boolean("game_reminders").notNull().default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  category: notificationCategoryEnum("category").notNull(),
  subject: text("subject"),
  status: notificationStatusEnum("status").notNull(),
  error: text("error"),
  sentAt: timestamp("sent_at", { mode: "date" }).notNull().defaultNow(),
});

/* ----------------------------------------------------------------------------
 * Locations (physical THG office spots)
 * ------------------------------------------------------------------------- */
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  building: text("building"),
  floor: text("floor"),
  capacity: integer("capacity"),
  notes: text("notes"),
  timezone: text("timezone").notNull().default("America/Indiana/Indianapolis"),
  active: boolean("active").notNull().default(true),
});

/* ----------------------------------------------------------------------------
 * Seasons & weeks (replaces v1's bare integer week)
 * ------------------------------------------------------------------------- */
export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  league: leagueEnum("league").notNull(),
  startDate: date("start_date", { mode: "date" }),
  numWeeks: integer("num_weeks").notNull().default(4),
  isActive: boolean("is_active").notNull().default(true),
});

export const weeks = pgTable(
  "weeks",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
    startsOn: date("starts_on", { mode: "date" }),
    pairingsLockAt: timestamp("pairings_lock_at", { mode: "date" }),
    scoresDueAt: timestamp("scores_due_at", { mode: "date" }),
    status: weekStatusEnum("status").notNull().default("pending"),
    generatedAt: timestamp("generated_at", { mode: "date" }),
    publishedAt: timestamp("published_at", { mode: "date" }),
  },
  (t) => [uniqueIndex("weeks_season_number_uq").on(t.seasonId, t.weekNumber)],
);

/* ----------------------------------------------------------------------------
 * Per-week opt-in (source of truth; not a global flag on users)
 * ------------------------------------------------------------------------- */
export const optIns = pgTable(
  "opt_ins",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekId: integer("week_id")
      .notNull()
      .references(() => weeks.id, { onDelete: "cascade" }),
    optedIn: boolean("opted_in").notNull().default(true),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weekId] })],
);

/* ----------------------------------------------------------------------------
 * Availability (source-agnostic so Outlook import can be added later)
 *   slot_index: 0..(slots per day - 1), 30-min slots over business hours.
 *   slot_key:   "{weekday}-{slot_index}" for comparing recurring vs overrides.
 * ------------------------------------------------------------------------- */
export const availabilityRecurring = pgTable(
  "availability_recurring",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(), // 0=Mon .. 4=Fri
    slotIndex: smallint("slot_index").notNull(),
    source: availabilitySourceEnum("source").notNull().default("manual"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weekday, t.slotIndex] })],
);

export const availabilityOverrides = pgTable(
  "availability_overrides",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekId: integer("week_id")
      .notNull()
      .references(() => weeks.id, { onDelete: "cascade" }),
    slotKey: text("slot_key").notNull(), // "{weekday}-{slotIndex}"
    isFree: boolean("is_free").notNull(),
    source: availabilitySourceEnum("source").notNull().default("manual"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weekId, t.slotKey] })],
);

/* ----------------------------------------------------------------------------
 * Matchups, players, games, scores
 * ------------------------------------------------------------------------- */
export const matchups = pgTable(
  "matchups",
  {
    id: serial("id").primaryKey(),
    weekId: integer("week_id")
      .notNull()
      .references(() => weeks.id, { onDelete: "cascade" }),
    league: leagueEnum("league").notNull(),
    locationId: integer("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    isBye: boolean("is_bye").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("matchups_week_idx").on(t.weekId)],
);

export const matchupPlayers = pgTable(
  "matchup_players",
  {
    matchupId: integer("matchup_id")
      .notNull()
      .references(() => matchups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seat: smallint("seat").notNull(), // 0..3 -> A/B/C/D
  },
  (t) => [
    primaryKey({ columns: [t.matchupId, t.userId] }),
    uniqueIndex("matchup_players_seat_uq").on(t.matchupId, t.seat),
  ],
);

export const games = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    matchupId: integer("matchup_id")
      .notNull()
      .references(() => matchups.id, { onDelete: "cascade" }),
    gameNum: smallint("game_num").notNull(), // 1..3
    comboIndex: smallint("combo_index"), // 0..2 (AB/CD, AC/BD, AD/BC)
    winnerTeam: smallint("winner_team"), // 0 or 1; null for ties or unsubmitted games
    submittedAt: timestamp("submitted_at", { mode: "date" }),
    submittedBy: uuid("submitted_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [uniqueIndex("games_matchup_num_uq").on(t.matchupId, t.gameNum)],
);

export const gameScores = pgTable(
  "game_scores",
  {
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    team: smallint("team").notNull(), // 0 or 1
  },
  (t) => [primaryKey({ columns: [t.gameId, t.userId] })],
);

/* ----------------------------------------------------------------------------
 * Scheduled games (time + place for a matchup)
 * ------------------------------------------------------------------------- */
export const scheduledGames = pgTable("scheduled_games", {
  id: serial("id").primaryKey(),
  matchupId: integer("matchup_id")
    .notNull()
    .unique()
    .references(() => matchups.id, { onDelete: "cascade" }),
  locationId: integer("location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
  durationMin: integer("duration_min").notNull().default(90),
  status: scheduleStatusEnum("status").notNull().default("unscheduled"),
  proposedBy: uuid("proposed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  confirmedAt: timestamp("confirmed_at", { mode: "date" }),
});

/* ----------------------------------------------------------------------------
 * Announcements
 * ------------------------------------------------------------------------- */
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
