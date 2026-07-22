export const CURRENT_STUDIO = {
  id: "open-studio-002",
  number: "002",
  path: "/studio/002/",
  title: "A Signal for People Who Haven’t Met Yet",
  prompt: "Make a public signal for people who haven’t met yet.",
  invitation: "One Noun. One sentence. Put it where a stranger could begin.",
  defaultMessage: "Meet here without a reason.",
  defaultMode: "sign",
  defaultPalette: "signal",
  constraints: [
    "Use one authentic CC0 Noun.",
    "Say something another person can act on.",
    "Leave enough room for the next person to change it.",
  ],
};

export const STARTER_WORKS = [
  {
    id: "studio-002-starter-01",
    edition: CURRENT_STUDIO.id,
    isStarter: true,
    message: "Meet here without a reason.",
    maker: "Open Studio 002",
    mode: "sign",
    palette: "signal",
    seed: { background: 1, body: 4, accessory: 26, head: 89, glasses: 3 },
  },
  {
    id: "studio-002-starter-02",
    edition: CURRENT_STUDIO.id,
    isStarter: true,
    message: "A club for people between plans.",
    maker: "Open Studio 002",
    mode: "club",
    palette: "civic",
    seed: { background: 0, body: 12, accessory: 87, head: 154, glasses: 15 },
  },
  {
    id: "studio-002-starter-03",
    edition: CURRENT_STUDIO.id,
    isStarter: true,
    message: "Borrow this face. Change the future.",
    maker: "Open Studio 002",
    mode: "institution",
    palette: "candy",
    seed: { background: 1, body: 27, accessory: 119, head: 211, glasses: 6 },
  },
];

export function findStarterWork(id) {
  return STARTER_WORKS.find((work) => work.id === id) || null;
}
