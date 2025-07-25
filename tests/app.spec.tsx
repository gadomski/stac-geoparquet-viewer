import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import App from "../src/app";
import { Provider } from "../src/components/ui/provider";

test("renders example button", async () => {
  const app = await render(
    <Provider>
      <App></App>
    </Provider>,
  );
  await expect
    .element(app.getByRole("button", { name: "examples" }))
    .toBeVisible();
});
