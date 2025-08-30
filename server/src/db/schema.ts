import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const budgetRequestStatusEnum = pgEnum('budget_request_status', [
  'draft',
  'processing',
  'review', 
  'approved',
  'rejected'
]);

export const budgetRequestPriorityEnum = pgEnum('budget_request_priority', [
  'low',
  'medium',
  'high', 
  'critical'
]);

// Departments table
export const departmentsTable = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  head_name: text('head_name').notNull(),
  contact_email: text('contact_email').notNull(),
  contact_phone: text('contact_phone'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Budget categories table
export const budgetCategoriesTable = pgTable('budget_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Budget requests table
export const budgetRequestsTable = pgTable('budget_requests', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  department_id: integer('department_id').notNull(),
  category_id: integer('category_id').notNull(),
  requested_amount: numeric('requested_amount', { precision: 12, scale: 2 }).notNull(),
  justification: text('justification').notNull(),
  priority: budgetRequestPriorityEnum('priority').notNull(),
  status: budgetRequestStatusEnum('status').notNull().default('draft'),
  fiscal_year: integer('fiscal_year').notNull(),
  expected_start_date: timestamp('expected_start_date').notNull(),
  expected_end_date: timestamp('expected_end_date').notNull(),
  submitted_by: text('submitted_by').notNull(),
  submitted_at: timestamp('submitted_at'),
  reviewed_by: text('reviewed_by'),
  reviewed_at: timestamp('reviewed_at'),
  review_notes: text('review_notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Budget line items table
export const budgetLineItemsTable = pgTable('budget_line_items', {
  id: serial('id').primaryKey(),
  budget_request_id: integer('budget_request_id').notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const departmentsRelations = relations(departmentsTable, ({ many }) => ({
  budgetRequests: many(budgetRequestsTable)
}));

export const budgetCategoriesRelations = relations(budgetCategoriesTable, ({ many }) => ({
  budgetRequests: many(budgetRequestsTable)
}));

export const budgetRequestsRelations = relations(budgetRequestsTable, ({ one, many }) => ({
  department: one(departmentsTable, {
    fields: [budgetRequestsTable.department_id],
    references: [departmentsTable.id]
  }),
  category: one(budgetCategoriesTable, {
    fields: [budgetRequestsTable.category_id],
    references: [budgetCategoriesTable.id]
  }),
  lineItems: many(budgetLineItemsTable)
}));

export const budgetLineItemsRelations = relations(budgetLineItemsTable, ({ one }) => ({
  budgetRequest: one(budgetRequestsTable, {
    fields: [budgetLineItemsTable.budget_request_id],
    references: [budgetRequestsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Department = typeof departmentsTable.$inferSelect;
export type NewDepartment = typeof departmentsTable.$inferInsert;

export type BudgetCategory = typeof budgetCategoriesTable.$inferSelect;
export type NewBudgetCategory = typeof budgetCategoriesTable.$inferInsert;

export type BudgetRequest = typeof budgetRequestsTable.$inferSelect;
export type NewBudgetRequest = typeof budgetRequestsTable.$inferInsert;

export type BudgetLineItem = typeof budgetLineItemsTable.$inferSelect;
export type NewBudgetLineItem = typeof budgetLineItemsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  departments: departmentsTable,
  budgetCategories: budgetCategoriesTable,
  budgetRequests: budgetRequestsTable,
  budgetLineItems: budgetLineItemsTable
};