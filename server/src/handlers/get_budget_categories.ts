import { type BudgetCategory } from '../schema';

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all budget categories for dropdowns/selection.
    // Features to implement:
    // 1. Fetch all active budget categories
    // 2. Order by name alphabetically
    // 3. Include category descriptions
    
    return Promise.resolve([
        {
            id: 1,
            name: "Equipment and Infrastructure",
            code: "EQP",
            description: "Funding for equipment purchases and infrastructure development",
            created_at: new Date()
        },
        {
            id: 2,
            name: "Personnel and Training",
            code: "PER",
            description: "Funding for personnel costs and training programs",
            created_at: new Date()
        },
        {
            id: 3,
            name: "Research and Development",
            code: "RND",
            description: "Funding for research projects and development activities",
            created_at: new Date()
        },
        {
            id: 4,
            name: "Operations and Maintenance",
            code: "OPS",
            description: "Funding for operational activities and maintenance",
            created_at: new Date()
        }
    ] as BudgetCategory[]);
}