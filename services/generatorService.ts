import { VariationResult, Separator } from "../types";

/**
 * Removes existing dots from the username part of a gmail address.
 * Dots in the domain are preserved.
 */
export const normalizeUsername = (email: string): { username: string, domain: string } => {
  const parts = email.split('@');
  if (parts.length !== 2) return { username: '', domain: '' };
  
  const [local, domain] = parts;
  // Remove existing dots from local part for clean generation base
  const cleanLocal = local.replace(/\./g, '');
  return { username: cleanLocal, domain };
};

// Synchronous version (legacy/small tasks)
export const generateDotVariations = (email: string): VariationResult[] => {
  const { username, domain } = normalizeUsername(email);
  const length = username.length;
  
  if (length <= 1) return [{ email: `${username}@${domain}`, isFavorite: false }];
  if (length > 20) throw new Error("Username too long");

  const variations: VariationResult[] = [];
  const totalCombinations = 1 << (length - 1);

  for (let i = 0; i < totalCombinations; i++) {
    let variant = "";
    for (let j = 0; j < length; j++) {
      variant += username[j];
      if (j < length - 1 && ((i >> j) & 1)) {
        variant += ".";
      }
    }
    variations.push({ email: `${variant}@${domain}`, isFavorite: false });
  }

  return variations;
};

/**
 * Async Generator for Dot Variations.
 * Yields results in chunks to allow UI updates (progress bar).
 */
export async function* generateDotVariationsAsync(email: string, chunkSize = 500): AsyncGenerator<VariationResult[]> {
  const { username, domain } = normalizeUsername(email);
  const length = username.length;
  
  if (length <= 1) {
    yield [{ email: `${username}@${domain}`, isFavorite: false }];
    return;
  }

  const totalCombinations = 1 << (length - 1);
  let currentBatch: VariationResult[] = [];

  for (let i = 0; i < totalCombinations; i++) {
    let variant = "";
    for (let j = 0; j < length; j++) {
      variant += username[j];
      if (j < length - 1 && ((i >> j) & 1)) {
        variant += ".";
      }
    }
    
    currentBatch.push({ email: `${variant}@${domain}`, isFavorite: false, sourceEmail: email });

    // Yield chunk
    if (currentBatch.length >= chunkSize) {
      yield currentBatch;
      currentBatch = [];
      // minimal delay to let event loop breathe
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (currentBatch.length > 0) {
    yield currentBatch;
  }
}

export const generatePlusVariations = (
  email: string, 
  tagsInput: string, 
  separator: Separator
): VariationResult[] => {
  const parts = email.split('@');
  if (parts.length !== 2) return [];
  const [local, domain] = parts;
  
  const tags = tagsInput
    .split(/[\n,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const uniqueTags = Array.from(new Set(tags));

  return uniqueTags.map(tag => ({
    email: `${local}${separator}${tag}@${domain}`,
    isFavorite: false,
    sourceEmail: email
  }));
};
