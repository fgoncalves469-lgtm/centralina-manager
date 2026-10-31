import { describe, expect, it } from "vitest";
import { gainPercent } from "@/lib/jobs";

describe("gainPercent", () => {
  it("calcula o ganho de 150 para 190 cv como 27%", () => {
    expect(gainPercent(150, 190)).toBe(27);
  });
  it("devolve null quando falta um valor", () => {
    expect(gainPercent(null, 190)).toBeNull();
  });
});
