export function Placeholder({ title }: { title: string }) {
  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>{title}</h2>
      <p className="text-muted">This module is planned for a future phase.</p>
    </div>
  );
}
