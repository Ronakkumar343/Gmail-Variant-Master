import { Separator } from "./types";

export const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/;
export const MAX_USERNAME_LENGTH_FOR_DOTS = 15; // 2^14 = 16384 variations. Safety limit.
export const PAGE_SIZE = 20;

export const SEPARATOR_OPTIONS = [
  { label: 'Plus (+)', value: Separator.PLUS },
  { label: 'Underscore (_)', value: Separator.UNDERSCORE },
  { label: 'Hyphen (-)', value: Separator.HYPHEN },
];

export const MOCK_TAGS = "newsletter\nshopping\nwork\nsocial\ntesting";
