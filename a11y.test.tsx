import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MoodPicker } from "@/components/MoodPicker";
import { CrisisBanner } from "@/components/CrisisBanner";

expect.extend(toHaveNoViolations);

describe("accessibility (axe)", () => {
  it("MoodPicker has no detectable a11y violations", async () => {
    const { container } = render(
      <MoodPicker value={3} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CrisisBanner has no detectable a11y violations", async () => {
    const { container } = render(<CrisisBanner />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CrisisBanner exposes helplines as an alert with clickable tel links", () => {
    const { getByRole, getAllByRole } = render(<CrisisBanner />);
    expect(getByRole("alert")).toBeInTheDocument();
    const links = getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(links[0]).toHaveAttribute("href", expect.stringContaining("tel:"));
  });
});
