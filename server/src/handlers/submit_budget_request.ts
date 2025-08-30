import { db } from '../db';
import { budgetRequestsTable } from '../db/schema';
import { type GetBudgetRequestByIdInput, type BudgetRequest } from '../schema';
import { eq } from 'drizzle-orm';

export async function submitBudgetRequest(input: GetBudgetRequestByIdInput): Promise<BudgetRequest | null> {
  try {
    // Find the budget request by ID
    const existingRequests = await db.select()
      .from(budgetRequestsTable)
      .where(eq(budgetRequestsTable.id, input.id))
      .execute();

    if (existingRequests.length === 0) {
      return null; // Budget request not found
    }

    const existingRequest = existingRequests[0];

    // Validate request is in draft status
    if (existingRequest.status !== 'draft') {
      throw new Error(`Budget request cannot be submitted. Current status: ${existingRequest.status}`);
    }

    // Validate all required fields are complete
    if (!existingRequest.title || !existingRequest.description || !existingRequest.justification) {
      throw new Error('Budget request is incomplete. All required fields must be filled.');
    }

    if (!existingRequest.expected_start_date || !existingRequest.expected_end_date) {
      throw new Error('Budget request is incomplete. Start and end dates are required.');
    }

    if (!existingRequest.submitted_by) {
      throw new Error('Budget request is incomplete. Submitter information is required.');
    }

    // Update status to 'processing' and set submitted_at timestamp
    const updateResult = await db.update(budgetRequestsTable)
      .set({
        status: 'processing',
        submitted_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(budgetRequestsTable.id, input.id))
      .returning()
      .execute();

    if (updateResult.length === 0) {
      throw new Error('Failed to update budget request status');
    }

    const updatedRequest = updateResult[0];

    // Convert numeric fields back to numbers before returning
    return {
      ...updatedRequest,
      requested_amount: parseFloat(updatedRequest.requested_amount)
    };
  } catch (error) {
    console.error('Budget request submission failed:', error);
    throw error;
  }
}