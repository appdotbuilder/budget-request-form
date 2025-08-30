import { db } from '../db';
import { departmentsTable } from '../db/schema';
import { type Department } from '../schema';
import { asc } from 'drizzle-orm';

export const getDepartments = async (): Promise<Department[]> => {
  try {
    // Fetch all departments ordered by name alphabetically
    const results = await db.select()
      .from(departmentsTable)
      .orderBy(asc(departmentsTable.name))
      .execute();

    // Return results directly since Department schema matches database schema
    return results;
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    throw error;
  }
};