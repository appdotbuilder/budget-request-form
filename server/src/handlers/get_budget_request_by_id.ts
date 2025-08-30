import { db } from '../db';
import { budgetRequestsTable } from '../db/schema';
import { type GetBudgetRequestByIdInput, type BudgetRequest } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBudgetRequestById(input: GetBudgetRequestByIdInput): Promise<BudgetRequest | null> {
  try {
    // Query budget request by ID
    const results = await db.select()
      .from(budgetRequestsTable)
      .where(eq(budgetRequestsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const budgetRequest = results[0];
    return {
      ...budgetRequest,
      requested_amount: parseFloat(budgetRequest.requested_amount)
    };
  } catch (error) {
    console.error('Failed to fetch budget request:', error);
    throw error;
  }
}