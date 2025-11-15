import { FileRecord } from "../models/file";

export class FileRepository {
  private static instance: FileRepository;
  private readonly files: FileRecord[] = [];

  private constructor() {}

  public static getInstance(): FileRepository {
    if (!FileRepository.instance) {
      FileRepository.instance = new FileRepository();
    }
    return FileRepository.instance;
  }

  public saveFile(file: FileRecord) {
    this.files.push(file);
    return file;
  }

  public getAllFiles() {
    return this.files;
  }

  public getFileById(id: string) {
    return this.files.find((f) => f.id === id);
  }

  public deleteFileById(id: string) {
  const index = this.files.findIndex(f => f.id === id);
  if (index !== -1) {
    const deleted = this.files.splice(index, 1);
    return deleted[0];
  }
  return null;
}
}
