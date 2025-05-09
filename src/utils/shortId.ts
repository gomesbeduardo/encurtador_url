import { nanoid } from "nanoid";

export const generateShortCode = (length: number = 6): string => {
  return nanoid(length);
};
