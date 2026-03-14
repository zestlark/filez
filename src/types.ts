export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  ownerHash?: string;
  files?: FileNode[];
}
