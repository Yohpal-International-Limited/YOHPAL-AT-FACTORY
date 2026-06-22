import { apiGet, apiPost, ApiResponse } from '../../lib/api';

type Trend = {
  id: string;
  topic: string;
  category: string;
  region?: string;
  country?: string;
  score: number;
  growthRate: number;
  source: string;
  createdAt: string;
};

async function getTrends() {
  try {
    const response = await apiGet<ApiResponse<Trend[]>>('/trends?take=50');
    return response.data || [];
  } catch {
    return [];
  }
}

export default async function TrendsPage() {
  const trends = await getTrends();

  async function discoverSeedTrends() {
    'use server';
    await apiPost('/trends/discover-seed');
  }

  return (
    <>
      <section className="header">
        <h1>Trend Command Center</h1>
        <p>Discover and review topics before they become YohPal Live seed scripts.</p>
      </section>
      <form action={discoverSeedTrends} className="actions">
        <button type="submit">Discover seed trends</button>
      </form>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Category</th>
              <th>Region</th>
              <th>Score</th>
              <th>Growth</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend) => (
              <tr key={trend.id}>
                <td>{trend.topic}</td>
                <td><span className="badge">{trend.category}</span></td>
                <td>{trend.region || trend.country || 'Global'}</td>
                <td>{trend.score}</td>
                <td>{trend.growthRate}</td>
                <td>{trend.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
