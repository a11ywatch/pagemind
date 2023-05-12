import type { Page } from "playwright";

type Metrics = {
  TaskDuration: number;
  ScriptDuration: number;
  RecalcStyleDuration: number;
  LayoutDuration: number;
};

export async function getMetrics(page: Page): Promise<Metrics> {
  const client = await page.context().newCDPSession(page);
  await client.send("Performance.enable");
  const perfMetricObject = await client.send("Performance.getMetrics");

  const metricObject = perfMetricObject?.metrics.reduce(
    (acc: Metrics, { name, value }) => {
      acc[name] = value;

      return acc;
    },
    {} as Metrics
  );

  return metricObject;
}
