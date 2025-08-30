import { db } from '../db';
import { 
  budgetRequestsTable, 
  budgetLineItemsTable, 
  departmentsTable, 
  budgetCategoriesTable 
} from '../db/schema';
import { type CreateBudgetRequestInput, type BudgetRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const createBudgetRequest = async (input: CreateBudgetRequestInput): Promise<BudgetRequest> => {
  try {
    // Calculate total amount from line items
    const totalLineItemsAmount = input.line_items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );

    // Validate that requested amount matches line items total
    if (Math.abs(input.requested_amount - totalLineItemsAmount) > 0.01) {
      throw new Error('Requested amount does not match sum of line items');
    }

    // Validate department exists
    const department = await db.select()
      .from(departmentsTable)
      .where(eq(departmentsTable.id, input.department_id))
      .execute();

    if (department.length === 0) {
      throw new Error('Department not found');
    }

    // Validate budget category exists
    const category = await db.select()
      .from(budgetCategoriesTable)
      .where(eq(budgetCategoriesTable.id, input.category_id))
      .execute();

    if (category.length === 0) {
      throw new Error('Budget category not found');
    }

    // Create budget request within transaction
    const budgetRequestResult = await db.transaction(async (tx) => {
      // Insert budget request
      const budgetRequestData = await tx.insert(budgetRequestsTable)
        .values({
          title: input.title,
          description: input.description,
          department_id: input.department_id,
          category_id: input.category_id,
          requested_amount: input.requested_amount.toString(),
          justification: input.justification,
          priority: input.priority,
          fiscal_year: input.fiscal_year,
          expected_start_date: input.expected_start_date,
          expected_end_date: input.expected_end_date,
          submitted_by: input.submitted_by
        })
        .returning()
        .execute();

      const budgetRequest = budgetRequestData[0];

      // Insert line items
      const lineItemsData = input.line_items.map(item => ({
        budget_request_id: budgetRequest.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price.toString(),
        total_amount: (item.quantity * item.unit_price).toString(),
        notes: item.notes
      }));

      await tx.insert(budgetLineItemsTable)
        .values(lineItemsData)
        .execute();

      return budgetRequest;
    });

    // Convert numeric fields back to numbers before returning
    return {
      ...budgetRequestResult,
      requested_amount: parseFloat(budgetRequestResult.requested_amount)
    };
  } catch (error) {
    console.error('Budget request creation failed:', error);
    throw error;
  }
};