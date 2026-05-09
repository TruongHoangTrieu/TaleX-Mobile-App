import { useQuery } from '@tanstack/react-query';
import { fetchFeed } from '../services/feed.api';

export const useFeed = () => {
  return useQuery(['feed'], fetchFeed);
};
