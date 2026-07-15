import { expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { App } from "./App";

test("App renders the ready status", () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId("status").textContent).toBe("ready");
});
