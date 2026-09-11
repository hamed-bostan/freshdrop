/** What every format writer produces — the bytes to upload, and the row count RunExportJob records on the job. */
export type WrittenFile = {
  data: Buffer;
  rowCount: number;
};
