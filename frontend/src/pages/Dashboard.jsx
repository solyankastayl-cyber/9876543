import { useDashboard } from '../hooks/useDashboard';
import { TokenTable } from '../components/TokenTable';

export function Dashboard() {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.tokens.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No tokens yet
          </h2>
          <p className="text-gray-600">
            Token rankings will appear here once data is ingested.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Tokens</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div>
            ML Status:{' '}
            <span className="font-medium">{data.globalState.mlStatus}</span>
          </div>
          <div>
            Drift:{' '}
            <span className="font-medium">{data.globalState.driftLevel}</span>
          </div>
          <div>
            Total Tokens:{' '}
            <span className="font-medium">
              {data.pagination.totalTokens}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <TokenTable tokens={data.tokens} />
      </div>
    </div>
  );
}
