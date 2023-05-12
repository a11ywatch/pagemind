import { CDPSession } from "playwright";

type Metrics = {
  TaskDuration: number;
  ScriptDuration: number;
  RecalcStyleDuration: number;
  LayoutDuration: number;
};

const supportedMetrics: Set<string> = new Set([
  "Timestamp",
  "Documents",
  "Frames",
  "JSEventListeners",
  "Nodes",
  "LayoutCount",
  "RecalcStyleCount",
  "LayoutDuration",
  "RecalcStyleDuration",
  "ScriptDuration",
  "TaskDuration",
  "JSHeapUsedSize",
  "JSHeapTotalSize",
]);

export async function getMetrics(client: CDPSession): Promise<Metrics> {
  const result = {
    ScriptDuration: 0,
    RecalcStyleDuration: 0,
    LayoutDuration: 0,
    TaskDuration: 0,
  };

  if (!client) {
    return result;
  }

  try {
    const perfMetricObject = await client.send("Performance.getMetrics");

    for (const metric of perfMetricObject?.metrics || []) {
      if (supportedMetrics.has(metric.name)) {
        result[metric.name] = metric.value;
      }
    }
  } catch (e) {
    console.error(e);
  }


  return result as Metrics;
}
