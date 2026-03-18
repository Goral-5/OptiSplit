import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';

/**
 * Custom hook for debounced user search
 * @param {string} query - Search query
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns {Object} - { users, isLoading, error, refetch }
 */
export function useUserSearch(query = '', debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Fetch users when debounced query changes
  const { data, isLoading, error, refetch } = useQuery(
    ['searchUsers', debouncedQuery],
    async () => {
      if (!debouncedQuery.trim()) {
        return { data: [] };
      }
      const response = await api.get(`/users/search?q=${encodeURIComponent(debouncedQuery)}`);
      return response.data;
    },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 5000, // Cache for 5 seconds
      retry: 1,
    }
  );

  return {
    users: data?.data || [],
    isLoading,
    error,
    refetch,
  };
}
