import { db } from '../db';
import { budgetRequestsTable } from '../db/schema';
import { type UpdateBudgetRequestInput, type BudgetRequest } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateBudgetRequest(input: UpdateBudgetRequestInput): Promise<BudgetRequest | null> {
  try {
    // First, verify the budget request exists
    const existing = await db.select()
      .from(budgetRequestsTable)
      .where(eq(budgetRequestsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Add fields that are provided in input
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.department_id !== undefined) {
      updateData.department_id = input.department_id;
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }
    if (input.requested_amount !== undefined) {
      updateData.requested_amount = input.requested_amount.toString();
    }
    if (input.justification !== undefined) {
      updateData.justification = input.justification;
    }
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }
    if (input.fiscal_year !== undefined) {
      updateData.fiscal_year = input.fiscal_year;
    }
    if (input.expected_start_date !== undefined) {
      updateData.expected_start_date = input.expected_start_date;
    }
    if (input.expected_end_date !== undefined) {
      updateData.expected_end_date = input.expected_end_date;
    }

    // Handle status transitions and special timestamps
    if (input.status !== undefined) {
      updateData.status = input.status;
      
      // Set submitted_at when transitioning to processing
      if (input.status === 'processing' && existing[0].submitted_at === null) {
        updateData.submitted_at = new Date();
      }
      
      // Set reviewed_at when transitioning to approved/rejected
      if ((input.status === 'approved' || input.status === 'rejected') && existing[0].reviewed_at === null) {
        updateData.reviewed_at = new Date();
      }
    }

    if (input.review_notes !== undefined) {
      updateData.review_notes = input.review_notes;
    }
    if (input.reviewed_by !== undefined) {
      updateData.reviewed_by = input.reviewed_by;
    }

    // Perform the update
    const result = await db.update(budgetRequestsTable)
      .set(updateData)
      .where(eq(budgetRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const updatedBudgetRequest = result[0];
    return {
      ...updatedBudgetRequest,
      requested_amount: parseFloat(updatedBudgetRequest.requested_amount)
    };
  } catch (error) {
    console.error('Budget request update failed:', error);
    throw error;
  }
}