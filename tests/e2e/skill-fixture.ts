import type { Page } from "@playwright/test";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import { EMPTY_SKILLS, type SkillProgress } from "../../src/lib/skill-economy";
import { skillPrice } from "../../src/lib/skill-economy";
import type { MethodId } from "../../src/lib/methods";
export async function mockSkills(
  page: Page,
  overrides: Partial<SkillProgress> = {},
) {
  const owner = "e1dcbb36-9c6e-4de6-8f57-f11b43765a7c";
  const state = {
    signedIn: true,
    progress: {
      ...structuredClone(EMPTY_SKILLS),
      balance: 3,
      unlocked: ["outline"] as MethodId[],
      ...overrides,
    },
    unlocks: 0,
    installs: 0,
    shortcuts: 0,
    completed: 0,
  };
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({
      json: {
        signedIn: state.signedIn,
        configured: true,
        accountId: state.signedIn ? owner : undefined,
      },
    }),
  );
  await page.route("**/api/auth/logout", (r) => {
    state.signedIn = false;
    return r.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/collection", (r) =>
    r.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        configured: true,
        signedIn: state.signedIn,
        accountId: owner,
        firstType: "visual-solo-planned",
        cards: [{ code: "visual-solo-planned", source: "first" }],
      },
    }),
  );
  await page.route("**/api/results", (r) =>
    r.fulfill({ json: { results: [] } }),
  );
  await page.route("**/api/skills", async (r) => {
    let awarded = 0;
    let now = Date.now();
    if (state.progress.practice || r.request().method() === "POST") {
      try {
        now = await page.evaluate(() => Date.now());
      } catch {
        return r.abort();
      }
    }
    const p = state.progress.practice;
    if (p) {
      p.elapsed = Math.min(
        600,
        Number(p.elapsed) +
          (p.status === "running"
            ? Math.max(0, now - new Date(p.updatedAt).getTime()) / 1000
            : 0),
      );
      p.updatedAt = new Date(now).toISOString();
    }
    if (r.request().method() === "POST") {
      const body = r.request().postDataJSON();
      if (body.action === "unlock") {
        if (!state.progress.unlocked.includes(body.method)) {
          const cost = skillPrice(body.method);
          if (state.progress.balance < cost)
            return r.fulfill({
              status: 409,
              json: { error: "insufficient_hearts" },
            });
          state.unlocks++;
          state.progress.balance -= cost;
          state.progress.unlocked.push(body.method);
        }
      } else if (body.action === "install") {
        if (!state.progress.installClaimed) {
          awarded = state.progress.shortcutClaimed ? 2 : 3;
          state.progress.balance += awarded;
          state.progress.installClaimed = true;
          state.installs++;
        }
      } else if (body.action === "shortcut") {
        if (
          body.confirmed &&
          !state.progress.shortcutClaimed &&
          !state.progress.installClaimed
        ) {
          awarded = 1;
          state.progress.balance++;
          state.progress.shortcutClaimed = true;
          state.shortcuts++;
        }
      } else if (body.action === "start") {
        state.progress.practice = {
          id: "5fef9d69-fc01-43b8-954b-22d34f7b2f89",
          method: body.method,
          status: "running",
          elapsed: 0,
          updatedAt: new Date(now).toISOString(),
        };
      } else if (body.action === "pause" && p) p.status = "paused";
      else if (body.action === "resume" && p) p.status = "running";
      else if (body.action === "cancel") state.progress.practice = null;
      else if (body.action === "complete" && p) {
        if (p.elapsed < 600)
          return r.fulfill({ status: 409, json: { error: "too_early" } });
        if (!state.progress.practiced.includes(p.method)) {
          state.progress.practiced.push(p.method);
          state.progress.balance++;
          awarded = 1;
        }
        state.completed++;
        state.progress.practice = null;
      }
    }
    return r.fulfill({
      json: {
        accountId: owner,
        progress: state.progress,
        awarded,
        outcome: "unlocked",
      },
    });
  });
  return state;
}
