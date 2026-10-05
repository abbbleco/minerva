export const ICON_PERSPECTIVES = ["iso", "dynamic", "front"] as const;

export type IconPerspective = (typeof ICON_PERSPECTIVES)[number];

export type PerspectiveSources = Record<IconPerspective, string>;

export interface WorkItem {
  slug: string;
  title: string;
  perspectives: PerspectiveSources;
}

function iconPerspectives(slug: string): PerspectiveSources {
  return {
    iso: `/img/landing/3D-icons/${slug}/iso.png`,
    dynamic: `/img/landing/3D-icons/${slug}/dynamic.png`,
    front: `/img/landing/3D-icons/${slug}/front.png`,
  };
}

interface IconDefinition {
  slug: string;
  title: string;
}

const PREMIUM_ICONS: IconDefinition[] = [
  { slug: "blender", title: "Blender" },
  { slug: "bookmark", title: "Bookmark" },
  { slug: "calculator", title: "Calculator" },
  { slug: "calendar", title: "Calendar" },
  // { slug: "calender", title: "Calendar V2" },
  // { slug: "call-missed", title: "Missed Call" },
  { slug: "chart", title: "Chart" },
  { slug: "chat-bubble", title: "Chat Bubble" },
  // { slug: "chat-text", title: "Chat Text" },
  // { slug: "computer", title: "Computer" },
  // { slug: "credit-card", title: "Credit Card" },
  // { slug: "cube", title: "Cube" },
  // { slug: "explorer", title: "Explorer" },
  { slug: "figma", title: "Figma" },
  { slug: "file-text", title: "File Text" },
  // { slug: "folder", title: "Folder" },
  { slug: "folder-fav", title: "Folder Fav" },
  // { slug: "frankenstein", title: "Frankenstein" },
  // { slug: "locker", title: "Locker" },
  { slug: "mail", title: "Mail" },
  // { slug: "map-pin", title: "Map Pin" },
  // { slug: "notebook", title: "Notebook" },
  // { slug: "notify-heart", title: "Notify Heart" },
  { slug: "picture", title: "Picture" },
  // { slug: "puzzle", title: "Puzzle" },
  { slug: "setting", title: "Setting" },
  // { slug: "shield", title: "Shield" },
  // { slug: "target", title: "Target" },
  // { slug: "text", title: "Text" },
  { slug: "travel", title: "Travel" },
  { slug: "video-cam", title: "Video Cam" },
  { slug: "wifi", title: "WiFi" },
  // { slug: "zoom", title: "Zoom" },
];

export const WORKS: WorkItem[] = PREMIUM_ICONS.map(({ slug, title }) => ({
  slug,
  title,
  perspectives: iconPerspectives(slug),
}));
