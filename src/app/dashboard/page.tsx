import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent } from '@mui/material';
import { Button } from '@mui/material';
import { Badge } from '@mui/material';
import { Settings, BarChart3, Home, Users, CheckCircle } from 'lucide-react';

const sessionsData = [
  { name: 'Apr 1', sessions: 1200 },
  { name: 'Apr 5', sessions: 3000 },
  { name: 'Apr 10', sessions: 5000 },
  { name: 'Apr 15', sessions: 7000 },
  { name: 'Apr 20', sessions: 10000 },
  { name: 'Apr 25', sessions: 13000 },
  { name: 'Apr 30', sessions: 15000 },
];

const pageViewsData = [
  { month: 'Jan', views: 8000 },
  { month: 'Feb', views: 9500 },
  { month: 'Mar', views: 8700 },
  { month: 'Apr', views: 10800 },
  { month: 'May', views: 12000 },
  { month: 'Jun', views: 9300 },
  { month: 'Jul', views: 8800 },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-sm">
        <div className="p-4 font-bold text-lg">Sitemark-web</div>
        <nav className="flex flex-col gap-2 p-4 text-sm text-gray-700">
          <div className="flex items-center gap-2"><Home size={16} /> Home</div>
          <div className="flex items-center gap-2"><BarChart3 size={16} /> Analytics</div>
          <div className="flex items-center gap-2"><Users size={16} /> Clients</div>
          <div className="flex items-center gap-2"><CheckCircle size={16} /> Tasks</div>
        </nav>
      </aside>
      <main className="flex-1 p-6 space-y-6">
        <div className="text-2xl font-semibold">Overview</div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Users</div>
              <div className="text-xl font-bold">14k <Badge className="ml-2" color="success">+25%</Badge></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Conversions</div>
              <div className="text-xl font-bold">325 <Badge className="ml-2" color="error">-25%</Badge></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Event Count</div>
              <div className="text-xl font-bold">200k <Badge className="ml-2" color="secondary">+5%</Badge></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-2">Sessions</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sessionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-2">Page Views and Downloads</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pageViewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#3182ce" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">Plan about to expire</div>
                <div className="text-sm text-gray-600">Enjoy 10% off when renewing your plan today.</div>
              </div>
              <Button color="secondary">Get the discount</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}