import { FileRecord } from "../models/file";

export class FileRepository {
  private static instance: FileRepository;
  private files: FileRecord[] = [];

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
}
