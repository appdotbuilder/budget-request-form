import { db } from '../db';
import { budgetCategoriesTable } from '../db/schema';
import { asc } from 'drizzle-orm';
import { type BudgetCategory } from '../schema';

export const getBudgetCategories = async (): Promise<BudgetCategory[]> => {
  try {
    // Fetch all budget categories ordered by name alphabetically
    const results = await db.select()
      .from(budgetCategoriesTable)
      .orderBy(asc(budgetCategoriesTable.name))
      .execute();

    // Return categories with all fields included
    return results;
  } catch (error) {
    console.error('Failed to fetch budget categories:', error);
    throw error;
  }
};