import { LineChart, Line } from "recharts";

export default function ProgressChart({ data }) {
  return (
    <LineChart width={300} height={200} data={data}>
      <Line type="monotone" dataKey="value" stroke="#38BDF8" />
    </LineChart>
  );
}
