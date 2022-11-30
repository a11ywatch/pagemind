import UserAgent from "user-agents";

// list of valid user agents to use.
let desktopAgentList = [];
let mobileAgentList = [];

// get a random agent from the list
const getRandomDesktopUA = () =>
  desktopAgentList[Math.floor(Math.random() * desktopAgentList.length)];
const getRandomMobileUA = () =>
  mobileAgentList[Math.floor(Math.random() * mobileAgentList.length)];

// regenerate random agents [todo: tie cron]
const generateRandomAgents = () => {
  const desktopAgent = new UserAgent({ deviceCategory: "desktop" });
  const mobileAgent = new UserAgent({ deviceCategory: "mobile" });

  desktopAgentList = Array.from({ length: 25 }, () => desktopAgent());
  mobileAgentList = Array.from({ length: 25 }, () => mobileAgent());
};

export { generateRandomAgents, getRandomDesktopUA, getRandomMobileUA };
