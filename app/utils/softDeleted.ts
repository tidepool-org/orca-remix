// The platform soft-deletes an upload record by stamping `deletedTime` on it,
// while hard-deleting the upload's datums. tide-whisperer returns those
// tombstones, so anything reading uploads has to drop them client-side or the
// deleted row keeps rendering.
//
// Presence is the signal, not the value — the platform's own query filters on
// `$exists`. The field is either absent or carries a timestamp.

export type SoftDeletable = {
  deletedTime?: string;
};

export function excludeSoftDeleted<T extends SoftDeletable>(records: T[]): T[] {
  return records.filter((record) => !record.deletedTime);
}
