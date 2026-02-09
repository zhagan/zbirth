export type RbmFileEntry = {
  name: string;
  data: Uint8Array;
  mime?: string;
};

export type RbmBundle = {
  entries: Map<string, RbmFileEntry>;
};
