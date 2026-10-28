import { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";

import {
  CACHE_BUSTER,
  clearPersistedCache,
  queryPersister,
  shouldPersist,
} from "./persister";

const options = {
  persister: queryPersister,
  buster: CACHE_BUSTER,
  dehydrateOptions: { shouldDehydrateQuery: shouldPersist },
};

beforeEach(() => {
  jest.useFakeTimers();
  clearPersistedCache();
});

afterEach(() => {
  jest.useRealTimers();
});

async function saveAndRelaunch(client: QueryClient): Promise<QueryClient> {
  await persistQueryClientSave({ queryClient: client, ...options });
  // The persister writes at most once a second.
  jest.advanceTimersByTime(1_000);

  const relaunched = new QueryClient();
  await persistQueryClientRestore({ queryClient: relaunched, ...options });
  return relaunched;
}

describe("query cache persistence", () => {
  it("keeps a query marked persist: true across a relaunch", async () => {
    const client = new QueryClient();
    await client.fetchQuery({
      queryKey: ["config"],
      queryFn: async () => ({ theme: "dark" }),
      meta: { persist: true },
    });

    const relaunched = await saveAndRelaunch(client);

    expect(relaunched.getQueryData(["config"])).toEqual({ theme: "dark" });
  });

  it("keeps an unmarked query in memory only", async () => {
    const client = new QueryClient();
    await client.fetchQuery({
      queryKey: ["me"],
      queryFn: async () => ({ email: "ada@example.com" }),
    });

    const relaunched = await saveAndRelaunch(client);

    expect(relaunched.getQueryData(["me"])).toBeUndefined();
  });

  it("never persists a failed query, even when marked", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await client
      .fetchQuery({
        queryKey: ["broken"],
        queryFn: async () => {
          throw new Error("nope");
        },
        meta: { persist: true },
      })
      .catch(() => {});

    const relaunched = await saveAndRelaunch(client);

    expect(relaunched.getQueryState(["broken"])).toBeUndefined();
  });
});
