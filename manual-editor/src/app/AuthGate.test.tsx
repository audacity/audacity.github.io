import { expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthGate } from "./AuthGate";
import { makeApi, type Me } from "./api";

function fetchReturning(response: () => Response | Promise<Response>) {
  return (async () => response()) as unknown as typeof fetch;
}

test("renders children with the authenticated user once auth-me resolves", async () => {
  const fetchMock = fetchReturning(
    () =>
      new Response(JSON.stringify({ login: "octocat", mode: "github" }), {
        headers: { "content-type": "application/json" },
      }),
  );
  const api = makeApi(fetchMock);

  let received: Me | undefined;
  render(
    <AuthGate api={api}>
      {(user) => {
        received = user;
        return <div data-testid="probe">{user.login}</div>;
      }}
    </AuthGate>,
  );

  expect(screen.getByTestId("auth-loading")).toBeDefined();

  await waitFor(() => expect(screen.getByTestId("probe")).toBeDefined());
  expect(received).toEqual({ login: "octocat", mode: "github" });
  expect(screen.getByText("octocat")).toBeDefined();
});

test("shows a sign-in card linking to /api/auth-login on a 401, without rendering children", async () => {
  const fetchMock = fetchReturning(
    () =>
      new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
      }),
  );
  const api = makeApi(fetchMock);

  render(
    <AuthGate api={api}>
      {() => <div data-testid="probe">should not render</div>}
    </AuthGate>,
  );

  await waitFor(() => expect(screen.getByTestId("auth-signin")).toBeDefined());
  const link = screen.getByTestId("auth-signin-link");
  expect(link.getAttribute("href")).toBe("/api/auth-login");
  expect(screen.queryByTestId("probe")).toBeNull();
});

test("shows an error card with retry on a non-401 failure, and retry refetches", async () => {
  let calls = 0;
  const fetchMock = fetchReturning(() => {
    calls += 1;
    if (calls === 1) return new Response("boom", { status: 500 });
    return new Response(JSON.stringify({ login: "dev", mode: "dev" }), {
      headers: { "content-type": "application/json" },
    });
  });
  const api = makeApi(fetchMock);

  render(
    <AuthGate api={api}>
      {(user) => <div data-testid="probe">{user.login}</div>}
    </AuthGate>,
  );

  await waitFor(() => expect(screen.getByTestId("auth-error")).toBeDefined());
  expect(calls).toBe(1);

  fireEvent.click(screen.getByTestId("auth-retry"));

  await waitFor(() => expect(screen.getByTestId("probe")).toBeDefined());
  expect(calls).toBe(2);
});
