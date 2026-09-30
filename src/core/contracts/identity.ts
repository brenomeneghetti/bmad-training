export type PieceId = string & { readonly __brand: "PieceId" };

export interface IdAllocator {
  next(): PieceId;
}

export const createIdAllocator = (start = 1): IdAllocator => {
  let value = start;
  return {
    next: () => `piece-${value++}` as PieceId,
  };
};
