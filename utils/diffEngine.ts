import * as Diff from 'diff';
import { ChangeType, DiffSegment } from '../types';

// ==========================================
// ITERATION 1: Unicode-Aware Tokenization
// ==========================================
// Standard diffWords breaks on international characters. This lexer understands Unicode letters (\p{L}),
// enforcing strictly "full word replacements" rather than fragmented letter-by-letter redlines.
const tokenize = (text: string): string[] => {
  return text.match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]+/gu) || [];
};

export const generateSmartDiff = (original: string, modified: string): DiffSegment[] => {
  // 1. Calculate base array diff using our custom unicode tokens
  const origTokens = tokenize(original);
  const modTokens = tokenize(modified);
  const rawChanges = Diff.diffArrays(origTokens, modTokens);

  const parsedSegments: DiffSegment[] = [];
  let currentId = 0;

  rawChanges.forEach((change) => {
    const text = change.value.join('');
    const type = change.added ? ChangeType.ADDED : change.removed ? ChangeType.REMOVED : ChangeType.UNCHANGED;
    
    parsedSegments.push({
      id: `raw-${currentId++}`,
      text,
      type
    });
  });

  // ==========================================
  // ITERATION 2: Semantic Cleanup & Ordering
  // ==========================================
  // Merge adjacent identical types and standardize ordering (Removal ALWAYS precedes Addition)
  const mergedSegments: DiffSegment[] = [];
  
  for (const seg of parsedSegments) {
    const last = mergedSegments[mergedSegments.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      mergedSegments.push({ ...seg });
    }
  }

  // Reordering mechanism: Swap [ADDED][REMOVED] -> [REMOVED][ADDED]
  for (let i = 0; i < mergedSegments.length - 1; i++) {
    if (mergedSegments[i].type === ChangeType.ADDED && mergedSegments[i+1].type === ChangeType.REMOVED) {
      const temp = mergedSegments[i];
      mergedSegments[i] = mergedSegments[i+1];
      mergedSegments[i+1] = temp;
    }
  }

  // ==========================================
  // ITERATION 3: Consolidate 'Swiss cheese' redlines
  // ==========================================
  // If we have back-to-back additions or removals separated only by minor unchanged text
  // (like whitespace or a single punctuation mark), merge them for readability.
  let consolidated: DiffSegment[] = [];
  mergedSegments.forEach(seg => {
    if (consolidated.length > 0) {
      const last = consolidated[consolidated.length - 1];
      if (last.type === seg.type && last.type !== ChangeType.UNCHANGED) {
        last.text += seg.text;
        return;
      }
    }
    consolidated.push({ ...seg });
  });

  let fullyConsolidated: DiffSegment[] = [];
  for (let i = 0; i < consolidated.length; i++) {
    const prev = fullyConsolidated[fullyConsolidated.length - 1];
    const curr = consolidated[i];
    const next = consolidated[i + 1];

    if (
      curr.type === ChangeType.UNCHANGED &&
      /^[.,\s]*$/.test(curr.text) && // Only whitespace or minor punctuation
      prev && next &&
      prev.type === next.type &&
      prev.type !== ChangeType.UNCHANGED
    ) {
      // Swallow the unchanged text into the previous block
      prev.text += curr.text;
    } else if (prev && prev.type === curr.type) {
      prev.text += curr.text;
    } else {
      fullyConsolidated.push({ ...curr, id: `seg-final-${fullyConsolidated.length}` });
    }
  }

  return fullyConsolidated;
};
