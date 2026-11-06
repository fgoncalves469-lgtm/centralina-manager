import { describe, it, expect } from "vitest";
import { canDeleteCar, canEditCar, tabsFor } from "@/lib/jobs";

describe("My Garage permissions", () => {
  it("viewer cannot delete a car, even their own", () => expect(canDeleteCar("viewer")).toBe(false));
  it("contributor can delete a car", () => expect(canDeleteCar("contributor")).toBe(true));
  it("admin can delete a car", () => expect(canDeleteCar("admin")).toBe(true));
  it("owner can edit their own car", () => expect(canEditCar("viewer", "u1", { owner_id: "u1" })).toBe(true));
  it("viewer cannot edit someone else's car", () => expect(canEditCar("viewer", "u1", { owner_id: "u2" })).toBe(false));
  it("viewer only sees the My Garage tab", () => expect(tabsFor("viewer").map((t) => t.label)).toEqual(["My Garage"]));
});
