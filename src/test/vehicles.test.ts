import { describe, expect, it } from "vitest";
import { engineLabel, parseEcus } from "@/lib/jobs";
describe("vehicles", () => {
  it("splits several ECUs", () => expect(parseEcus("IAW 1AP / IAW 48P2")).toEqual(["IAW 1AP", "IAW 48P2"]));
  it("labels engine with code", () => expect(engineLabel({ engine: "1.6 16V", engine_code: "TU5JP4" })).toBe("1.6 16V (TU5JP4)"));
});
