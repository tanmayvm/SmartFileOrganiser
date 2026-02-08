
export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  handle?: FileSystemFileHandle; // Present in Native mode
  rawFile?: File; // Present in Fallback mode
}

export interface Folder {
  id: string;
  name: string;
  count: number;
  handle?: FileSystemDirectoryHandle; // Present in Native mode
  virtualAssets?: Asset[]; // Used for tracking moves in Fallback mode
}

export interface FileSystemState {
  assets: Asset[];
  folders: Folder[];
  isLoading: boolean;
  rootHandle: FileSystemDirectoryHandle | null;
  transferring: boolean;
  progress: number;
  error: string | null;
  isNativeSupported: boolean;
  isFallbackActive: boolean;
}
