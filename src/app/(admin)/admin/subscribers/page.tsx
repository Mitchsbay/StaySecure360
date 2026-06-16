'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import AdminLayout from '@/components/admin/AdminLayout';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source_page: string | null;
  lead_magnet_id: string | null;
  consent: boolean;
  created_at: string;
  lead_magnet_title?: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select(`
          id,
          email,
          name,
          source_page,
          lead_magnet_id,
          consent,
          created_at,
          lead_magnets(title)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscribers:', error);
      } else {
        // Map the lead magnets data to title
        const mappedData = (data || []).map((subscriber: any) => ({
          ...subscriber,
          lead_magnet_title: subscriber.lead_magnets?.title || null,
        }));
        setSubscribers(mappedData);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Prepare CSV headers
      const headers = ['Email', 'Name', 'Source Page', 'Lead Magnet', 'Consent', 'Joined Date'];

      // Prepare CSV rows
      const rows = subscribers.map((sub) => [
        `"${sub.email.replace(/"/g, '""')}"`, // Escape quotes
        `"${(sub.name || '').replace(/"/g, '""')}"`,
        `"${(sub.source_page || '').replace(/"/g, '""')}"`,
        `"${(sub.lead_magnet_title || '').replace(/"/g, '""')}"`,
        sub.consent ? 'Yes' : 'No',
        formatDate(sub.created_at),
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `subscribers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Subscribers</h1>
            <p className="text-dark-400 mt-2">Manage email subscribers</p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={exporting || loading || subscribers.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-500 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Subscribers Table */}
        <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-dark-400">Loading subscribers...</div>
          ) : subscribers.length === 0 ? (
            <div className="p-6 text-center text-dark-400">
              No subscribers found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-800 bg-dark-800/50">
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Source Page</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Lead Magnet</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Consent</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-white font-medium">{subscriber.email}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">{subscriber.name || '-'}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">{subscriber.source_page || '-'}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">{subscriber.lead_magnet_title || '-'}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          subscriber.consent
                            ? 'bg-success-500/20 text-success-400'
                            : 'bg-dark-800 text-dark-300'
                        }`}>
                          {subscriber.consent ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-dark-300">{formatDate(subscriber.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && subscribers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-dark-900 rounded-lg border border-dark-800 p-4">
              <p className="text-dark-400 text-sm">Total Subscribers</p>
              <p className="text-white text-2xl font-bold mt-1">{subscribers.length}</p>
            </div>
            <div className="bg-dark-900 rounded-lg border border-dark-800 p-4">
              <p className="text-dark-400 text-sm">With Consent</p>
              <p className="text-white text-2xl font-bold mt-1">
                {subscribers.filter((s) => s.consent).length}
              </p>
            </div>
            <div className="bg-dark-900 rounded-lg border border-dark-800 p-4">
              <p className="text-dark-400 text-sm">From Lead Magnets</p>
              <p className="text-white text-2xl font-bold mt-1">
                {subscribers.filter((s) => s.lead_magnet_id).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
