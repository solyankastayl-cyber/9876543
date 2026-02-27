// B4.3 - Batch Jobs Hook
// Manages batch parsing jobs state

import { useState, useCallback } from 'react';

export function useBatchJobs() {
  const [jobs, setJobs] = useState([]);

  const addJob = useCallback((job) => {
    setJobs(prev => [job, ...prev]);
  }, []);

  const updateJob = useCallback((id, patch) => {
    setJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, ...patch } : j))
    );
  }, []);

  const removeJob = useCallback((id) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const clearJobs = useCallback(() => {
    setJobs([]);
  }, []);

  const getJob = useCallback((id) => {
    return jobs.find(j => j.id === id);
  }, [jobs]);

  return {
    jobs,
    addJob,
    updateJob,
    removeJob,
    clearJobs,
    getJob,
  };
}
