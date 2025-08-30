import { type Department } from '../schema';

export async function getDepartments(): Promise<Department[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all departments for dropdowns/selection.
    // Features to implement:
    // 1. Fetch all active departments
    // 2. Order by name alphabetically
    // 3. Include basic department information
    
    return Promise.resolve([
        {
            id: 1,
            name: "Forest Conservation Department",
            code: "FCD",
            description: "Responsible for forest conservation programs",
            head_name: "Dr. Ahmad Susanto",
            contact_email: "fcd@forestry.go.id",
            contact_phone: "+62-21-1234567",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            name: "Forest Research Department",
            code: "FRD", 
            description: "Conducts forestry research and development",
            head_name: "Prof. Siti Rahma",
            contact_email: "frd@forestry.go.id",
            contact_phone: "+62-21-7654321",
            created_at: new Date(),
            updated_at: new Date()
        }
    ] as Department[]);
}