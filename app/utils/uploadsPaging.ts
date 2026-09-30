/**
 * Uploads per page. With no total there is no page count to navigate by, so a
 * larger page means fewer clicks. Matches platform's own default.
 */
export const uploadsPageSize = 100;

/**
 * The requested uploads page, 1-based, from a route's search params.
 *
 * A non-numeric value reads as page 1 rather than propagating `NaN` into the
 * page arithmetic, where it would reach the API as `page=NaN`.
 */
export function parseUploadsPage(searchParams: URLSearchParams): number {
  const requested = Number.parseInt(searchParams.get('uploadsPage') || '1', 10);
  return Number.isNaN(requested) ? 1 : Math.max(1, requested);
}

/**
 * How many uploads are known to exist, given one page of a list whose source
 * reports no total.
 *
 * Rows on the current page prove every earlier page was full, because the
 * endpoint skips `page * size` records to reach it. An empty page proves nothing
 * of the sort — it is what a blind jump past the end returns — so the pages
 * behind it cannot be counted, and the answer is 0.
 */
export function knownUploadCount(
  page: number,
  pageSize: number,
  rowsOnPage: number,
): number {
  if (rowsOnPage <= 0) return 0;
  return (page - 1) * pageSize + rowsOnPage;
}
