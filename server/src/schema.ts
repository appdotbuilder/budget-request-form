import { z } from 'zod';

// Budget request status enum
export const budgetRequestStatusSchema = z.enum([
  'draft',
  'processing', 
  'review',
  'approved',
  'rejected'
]);

export type BudgetRequestStatus = z.infer<typeof budgetRequestStatusSchema>;

// Budget request priority enum
export const budgetRequestPrioritySchema = z.enum([
  'low',
  'medium', 
  'high',
  'critical'
]);

export type BudgetRequestPriority = z.infer<typeof budgetRequestPrioritySchema>;

// Department schema
export const departmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  head_name: z.string(),
  contact_email: z.string().email(),
  contact_phone: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Department = z.infer<typeof departmentSchema>;

// Budget category schema
export const budgetCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type BudgetCategory = z.infer<typeof budgetCategorySchema>;

// Budget request schema
export const budgetRequestSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  department_id: z.number(),
  category_id: z.number(),
  requested_amount: z.number(),
  justification: z.string(),
  priority: budgetRequestPrioritySchema,
  status: budgetRequestStatusSchema,
  fiscal_year: z.number().int(),
  expected_start_date: z.coerce.date(),
  expected_end_date: z.coerce.date(),
  submitted_by: z.string(),
  submitted_at: z.coerce.date().nullable(),
  reviewed_by: z.string().nullable(),
  reviewed_at: z.coerce.date().nullable(),
  review_notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BudgetRequest = z.infer<typeof budgetRequestSchema>;

// Budget line item schema
export const budgetLineItemSchema = z.object({
  id: z.number(),
  budget_request_id: z.number(),
  description: z.string(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_amount: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type BudgetLineItem = z.infer<typeof budgetLineItemSchema>;

// Input schemas for creating budget requests
export const createBudgetRequestInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be less than 2000 characters"),
  department_id: z.number().positive("Department is required"),
  category_id: z.number().positive("Category is required"),
  requested_amount: z.number().positive("Requested amount must be positive"),
  justification: z.string().min(1, "Justification is required").max(2000, "Justification must be less than 2000 characters"),
  priority: budgetRequestPrioritySchema,
  fiscal_year: z.number().int().min(2020).max(2050),
  expected_start_date: z.coerce.date(),
  expected_end_date: z.coerce.date(),
  submitted_by: z.string().min(1, "Submitter name is required"),
  line_items: z.array(z.object({
    description: z.string().min(1, "Line item description is required"),
    quantity: z.number().int().positive("Quantity must be positive"),
    unit_price: z.number().positive("Unit price must be positive"),
    notes: z.string().nullable()
  })).min(1, "At least one line item is required")
}).refine((data) => data.expected_end_date >= data.expected_start_date, {
  message: "End date must be after or equal to start date",
  path: ["expected_end_date"]
});

export type CreateBudgetRequestInput = z.infer<typeof createBudgetRequestInputSchema>;

// Input schema for updating budget requests
export const updateBudgetRequestInputSchema = z.object({
  id: z.number().positive(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  department_id: z.number().positive().optional(),
  category_id: z.number().positive().optional(),
  requested_amount: z.number().positive().optional(),
  justification: z.string().min(1).max(2000).optional(),
  priority: budgetRequestPrioritySchema.optional(),
  fiscal_year: z.number().int().min(2020).max(2050).optional(),
  expected_start_date: z.coerce.date().optional(),
  expected_end_date: z.coerce.date().optional(),
  status: budgetRequestStatusSchema.optional(),
  review_notes: z.string().nullable().optional(),
  reviewed_by: z.string().nullable().optional()
});

export type UpdateBudgetRequestInput = z.infer<typeof updateBudgetRequestInputSchema>;

// Input schema for creating departments
export const createDepartmentInputSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100),
  code: z.string().min(1, "Department code is required").max(20),
  description: z.string().nullable(),
  head_name: z.string().min(1, "Head name is required").max(100),
  contact_email: z.string().email("Valid email is required"),
  contact_phone: z.string().nullable()
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentInputSchema>;

// Input schema for creating budget categories
export const createBudgetCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  code: z.string().min(1, "Category code is required").max(20),
  description: z.string().nullable()
});

export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategoryInputSchema>;

// Query input schemas
export const getBudgetRequestsInputSchema = z.object({
  department_id: z.number().optional(),
  status: budgetRequestStatusSchema.optional(),
  fiscal_year: z.number().int().optional(),
  priority: budgetRequestPrioritySchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type GetBudgetRequestsInput = z.infer<typeof getBudgetRequestsInputSchema>;

export const getBudgetRequestByIdInputSchema = z.object({
  id: z.number().positive()
});

export type GetBudgetRequestByIdInput = z.infer<typeof getBudgetRequestByIdInputSchema>;