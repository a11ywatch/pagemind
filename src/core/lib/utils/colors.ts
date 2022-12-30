// duration color
export const getCrawlDurationColor = (duration: number) =>
  duration <= 1500 ? "#A5D6A7" : duration <= 3000 ? "#E6EE9C" : "#EF9A9A";
