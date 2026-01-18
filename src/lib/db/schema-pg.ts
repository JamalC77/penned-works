import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

// Users
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").notNull(),
});

// Projects (a book, novel, collection, etc.)
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Chapters within a project
export const chapters = pgTable("chapters", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").default(""),
  order: integer("order").notNull(),
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Version history for chapters
export const versions = pgTable("versions", {
  id: text("id").primaryKey(),
  chapterId: text("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").notNull(),
  label: text("label"),
});

// ============================================
// STORY BIBLE TABLES
// ============================================

// Characters
export const characters = pgTable("characters", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  aliases: text("aliases"),
  physicalDescription: text("physical_description"),
  age: text("age"),
  personality: text("personality"),
  backstory: text("backstory"),
  notes: text("notes"),
  firstAppearance: text("first_appearance"),
  isMainCharacter: boolean("is_main_character").default(false),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Character relationships
export const characterRelationships = pgTable("character_relationships", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  character1Id: text("character1_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  character2Id: text("character2_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
});

// Locations
export const locations = pgTable("locations", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sensoryDetails: text("sensory_details"),
  significance: text("significance"),
  parentLocationId: text("parent_location_id"),
  firstAppearance: text("first_appearance"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Timeline events
export const timelineEvents = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  storyDate: text("story_date"),
  duration: text("duration"),
  chapterId: text("chapter_id").references(() => chapters.id, { onDelete: "set null" }),
  order: integer("order").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Important objects/items
export const storyItems = pgTable("story_items", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  significance: text("significance"),
  currentPossessor: text("current_possessor"),
  firstAppearance: text("first_appearance"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Plot threads
export const plotThreads = pgTable("plot_threads", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  introducedIn: text("introduced_in"),
  resolvedIn: text("resolved_in"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// World building rules
export const worldRules = pgTable("world_rules", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  limitations: text("limitations"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Consistency flags
export const consistencyFlags = pgTable("consistency_flags", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  location1: text("location1"),
  location2: text("location2"),
  status: text("status").notNull().default("open"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type Version = typeof versions.$inferSelect;
export type NewVersion = typeof versions.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type CharacterRelationship = typeof characterRelationships.$inferSelect;
export type NewCharacterRelationship = typeof characterRelationships.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type NewTimelineEvent = typeof timelineEvents.$inferInsert;
export type StoryItem = typeof storyItems.$inferSelect;
export type NewStoryItem = typeof storyItems.$inferInsert;
export type PlotThread = typeof plotThreads.$inferSelect;
export type NewPlotThread = typeof plotThreads.$inferInsert;
export type WorldRule = typeof worldRules.$inferSelect;
export type NewWorldRule = typeof worldRules.$inferInsert;
export type ConsistencyFlag = typeof consistencyFlags.$inferSelect;
export type NewConsistencyFlag = typeof consistencyFlags.$inferInsert;
