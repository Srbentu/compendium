import { beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";

// Setup MSW for API mocking in tests
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());