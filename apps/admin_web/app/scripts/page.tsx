import { apiGet, apiPost, ApiResponse } from '../../lib/api';

type Script = {
  id: string;
  title: string;
  hook: string;
  language: string;
  qualityScore: number;
  factScore: number;
  createdAt: string;
  trend?: {
    topic: string;
    category: string;
  };
};

async function getScripts() {
  try {
    const response = await apiGet<ApiResponse<Script[]>>('/scripts?take=50');
    return response.data || [];
  } catch {
    return [];
  }
}

export default async function ScriptsPage() {
  const scripts = await getScripts();

  async function generatePendingScripts() {
    'use server';
    await apiPost('/scripts/generate-pending?take=20');
  }

  return (
    <>
      <section className="header">
        <h1>AI Script Factory</h1>
        <p>Generate and inspect scripts produced from approved seed trends.</p>
      </section>
      <form action={generatePendingScripts} className="actions">
        <button type="submit">Generate pending scripts</button>
      </form>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Hook</th>
              <th>Quality</th>
              <th>Fact</th>
            </tr>
          </thead>
          <tbody>
            {scripts.map((script) => (
              <tr key={script.id}>
                <td>{script.title}</td>
                <td>
                  <span className="badge">
                    {script.trend?.category || 'seed'}
                  </span>
                </td>
                <td>{script.hook}</td>
                <td>{script.qualityScore}</td>
                <td>{script.factScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
