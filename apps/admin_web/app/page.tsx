import { apiGet, ApiResponse } from '../lib/api';

type HealthResponse = {
  service: string;
  status: string;
  services: Record<string, string>;
};

async function getHealth() {
  try {
    return await apiGet<HealthResponse>('/health');
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const health = await getHealth();
  return (
    <>
      <section className="header">
        <h1>YohPal Live AI Content Factory</h1>
        <p>Command center for seed trends, scripts, videos, moderation, and feeds.</p>
      </section>
      <section className="grid cols-4">
        <div className="card">
          <h3>Gateway</h3>
          <div className="statValue">{health?.status || 'down'}</div>
        </div>
        <div className="card">
          <h3>Seed Pipeline</h3>
          <div className="statValue">Ready</div>
        </div>
        <div className="card">
          <h3>Mode</h3>
          <div className="statValue">Mock</div>
        </div>
        <div className="card">
          <h3>Launch Goal</h3>
          <div className="statValue">100K</div>
        </div>
      </section>
      <section className="card" style={{ marginTop: 20 }}>
        <h3>Connected Services</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {health?.services &&
              Object.entries(health.services).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
