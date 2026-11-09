import { describe, it, expect } from "vitest";
import { canEditJob } from "@/lib/jobs";

const job = { created_by: "owner" };
describe("canEditJob", () => {
  it("admin can edit any job", () => expect(canEditJob("admin", "x", job, [])).toBe(true));
  it("retired contributor cannot edit an assigned job", () => expect(canEditJob("contributor", "c", job, ["c"])).toBe(false));
  it("contributor cannot edit an unassigned job", () => expect(canEditJob("contributor", "c", job, [])).toBe(false));
  it("viewer cannot edit even if assigned", () => expect(canEditJob("viewer", "v", job, ["v"])).toBe(false));
});
