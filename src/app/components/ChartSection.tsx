export default function ChartSection() {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        <div className="bg-white p-4 rounded-lg dark:bg-gray-800 shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">Sessions</h3>
          <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 dark:text-gray-300">
            [ Chart Placeholder ]
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Page views and downloads</h3>
          <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400">
            [ Bar Chart Placeholder ]
          </div>
        </div>
      </section>
    );
  }
  