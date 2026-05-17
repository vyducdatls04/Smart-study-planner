import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ProgressChart({ completed, total }) {
  const data = [
    { name: "Hoàn thành", value: completed },
    { name: "Chưa hoàn thành", value: total - completed },
  ];

  const COLORS = ["#22c55e", "#e5e7eb"];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <p className="text-center mt-2 text-sm text-gray-500">
        {total === 0
          ? "Chưa có dữ liệu"
          : `${Math.round((completed / total) * 100)}% hoàn thành`}
      </p>
    </div>
  );
}
