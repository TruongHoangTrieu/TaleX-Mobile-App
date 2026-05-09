import { apiClient } from '../../../services/api/client';
import { FeedItemResponse } from '../../../types/api/responses';

export const fetchFeed = async (): Promise<FeedItemResponse[]> => {
  const { data } = await apiClient.get('/feed');
  return data as FeedItemResponse[];
};
