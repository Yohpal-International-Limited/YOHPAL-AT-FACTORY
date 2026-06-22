import { apiGet, apiPost, ApiResponse } from '../../lib/api';

type Video = {
  id: string;
  title: string;
  category: string;
  status: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  region?: string;
  country?: string;
  durationSeconds?: number;
};

async function getVideos() {
  try {
    const response = await apiGet<ApiResponse<Video[]>>('/render/videos?take=50');
    return response.data || [];
  } catch {
    return [];
  }
}

export default async function VideosPage() {
  const videos = await getVideos();

  async function createPendingJobs() {
    'use server';
    await apiPost('/render/jobs/create-pending?take=20');
  }

  async function renderPendingVideos() {
    'use server';
    await apiPost('/render/videos/render-pending?take=20');
  }

  return (
    <>
      <section className="header">
        <h1>Seed Video Library</h1>
        <p>Create render jobs, mock-render videos, and inspect production readiness.</p>
      </section>
      <div className="actions">
        <form action={createPendingJobs}>
          <button type="submit">Create pending jobs</button>
        </form>
        <form action={renderPendingVideos}>
          <button type="submit" className="secondary">Render pending videos</button>
        </form>
      </div>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Region</th>
              <th>Duration</th>
              <th>Video URL</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id}>
                <td>{video.title}</td>
                <td><span className="badge">{video.category}</span></td>
                <td>{video.status}</td>
                <td>{video.region || video.country || 'Global'}</td>
                <td>{video.durationSeconds || '-'}s</td>
                <td>{video.videoUrl ? 'Ready' : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
