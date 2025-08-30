import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createBudgetRequestInputSchema,
  updateBudgetRequestInputSchema,
  getBudgetRequestsInputSchema,
  getBudgetRequestByIdInputSchema
} from './schema';

// Import handlers
import { createBudgetRequest } from './handlers/create_budget_request';
import { getBudgetRequests } from './handlers/get_budget_requests';
import { getBudgetRequestById } from './handlers/get_budget_request_by_id';
import { updateBudgetRequest } from './handlers/update_budget_request';
import { getDepartments } from './handlers/get_departments';
import { getBudgetCategories } from './handlers/get_budget_categories';
import { submitBudgetRequest } from './handlers/submit_budget_request';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Budget request operations
  createBudgetRequest: publicProcedure
    .input(createBudgetRequestInputSchema)
    .mutation(({ input }) => createBudgetRequest(input)),

  getBudgetRequests: publicProcedure
    .input(getBudgetRequestsInputSchema)
    .query(({ input }) => getBudgetRequests(input)),

  getBudgetRequestById: publicProcedure
    .input(getBudgetRequestByIdInputSchema)
    .query(({ input }) => getBudgetRequestById(input)),

  updateBudgetRequest: publicProcedure
    .input(updateBudgetRequestInputSchema)
    .mutation(({ input }) => updateBudgetRequest(input)),

  submitBudgetRequest: publicProcedure
    .input(getBudgetRequestByIdInputSchema)
    .mutation(({ input }) => submitBudgetRequest(input)),

  // Reference data operations
  getDepartments: publicProcedure
    .query(() => getDepartments()),

  getBudgetCategories: publicProcedure
    .query(() => getBudgetCategories()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();