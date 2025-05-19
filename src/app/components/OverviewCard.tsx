interface Props {
    title: string;
    value: string;
    change: string;
  }
  
  export default function OverviewCard({ title, value, change }: Props) {
    const isPositive = change.startsWith("+");
  
    return (
      <div className="bg-white p-4 rounded-lg shadow flex flex-col">
        <h3 className="text-sm text-gray-500">{title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xl font-bold">{value}</span>
          <span className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {change}
          </span>
        </div>
      </div>
    );
  }
  