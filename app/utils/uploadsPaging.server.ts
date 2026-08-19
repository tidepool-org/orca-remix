import { apiRequestSafe, apiRoutes } from '~/api.server';
import type { DataSet, DataSetsResponse } from '~/components/User/types';
import type { ResourceState } from '~/api.types';
import { resolveDeviceNames } from '~/utils/deviceNames.server';
import { uploadsPageSize } from '~/utils/uploadsPaging';

/** The endpoint answers with a bare array; the envelope form is defensive. */
function toRows(response: DataSetsResponse | undefined): DataSet[] {
  return Array.isArray(response) ? response : (response?.data ?? []);
}

export type UploadsPage = {
  dataSetsState: ResourceState<DataSet[]>;
  /** Whether a further page exists. Drives the pager's Next button. */
  hasMore: boolean;
};

/**
 * Fetch one page of uploads plus the answer to "is there another page".
 *
 * The has-more answer needs its own request. Platform skips `page * size` rows,
 * so `size` is the offset multiplier as well as the page length — widening it to
 * carry a probe row shifts every later page's offset and silently drops one
 * upload per boundary. With `size: 1` the `page` index counts single rows, so
 * `uploadsPage * uploadsPageSize` addresses exactly the row that would open the
 * next page.
 *
 * The two requests run concurrently, and callers can await this alongside their
 * own loader fetches without serialising anything.
 */
export async function loadUploadsPage(
  userId: string,
  uploadsPage: number,
): Promise<UploadsPage> {
  const [listState, nextPageState] = await Promise.all([
    apiRequestSafe<DataSetsResponse>(
      apiRoutes.data.getDataSets(userId, {
        page: uploadsPage - 1,
        size: uploadsPageSize,
      }),
    ),
    apiRequestSafe<DataSetsResponse>(
      apiRoutes.data.getDataSets(userId, {
        page: uploadsPage * uploadsPageSize,
        size: 1,
      }),
    ),
  ]);

  // The platform response carries no `deviceName`, so the page's names are
  // recovered by a per-device-model probe.
  const dataSetsState: ResourceState<DataSet[]> =
    listState.status === 'success'
      ? {
          status: 'success',
          data: await resolveDeviceNames(userId, toRows(listState.data)),
        }
      : (listState as ResourceState<DataSet[]>);

  // A failed probe reads as "no further page" rather than failing the panel —
  // it only decides whether Next is enabled.
  const hasMore =
    nextPageState.status === 'success' && toRows(nextPageState.data).length > 0;

  return { dataSetsState, hasMore };
}
