export default function StatCard({ title, value, color }) {
  return (
    <div
      className="p-5 rounded-2xl shadow-sm"
      style={{ background: color }}
    >
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}