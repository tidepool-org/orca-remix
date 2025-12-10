import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Input,
  Textarea,
  Spinner,
} from '@heroui/react';
import { FileSpreadsheet, Calendar, Download, Users } from 'lucide-react';
import { format, subDays } from 'date-fns';

export type ClinicReportSectionProps = {
  onGenerateReport: (options: {
    createdFrom?: string;
    createdTo?: string;
    ignoredUsernames?: string[];
  }) => Promise<void>;
  isLoading?: boolean;
};

export default function ClinicReportSection({
  onGenerateReport,
  isLoading = false,
}: ClinicReportSectionProps) {
  const [createdFrom, setCreatedFrom] = useState<string>('');
  const [createdTo, setCreatedTo] = useState<string>('');
  const [ignoredUsernames, setIgnoredUsernames] = useState<string>('');

  // Quick date range presets
  const setDateRange = (days: number | null) => {
    const now = new Date();
    if (days === null) {
      setCreatedFrom('');
      setCreatedTo('');
    } else {
      setCreatedFrom(format(subDays(now, days), 'yyyy-MM-dd'));
      setCreatedTo(format(now, 'yyyy-MM-dd'));
    }
  };

  const handleGenerateReport = async () => {
    const options: {
      createdFrom?: string;
      createdTo?: string;
      ignoredUsernames?: string[];
    } = {};

    if (createdFrom) {
      options.createdFrom = new Date(createdFrom).toISOString();
    }
    if (createdTo) {
      options.createdTo = new Date(createdTo).toISOString();
    }
    if (ignoredUsernames.trim()) {
      options.ignoredUsernames = ignoredUsernames
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
    }

    await onGenerateReport(options);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3">
        <FileSpreadsheet className="w-5 h-5 text-primary" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">Clinic Users Report</p>
          <p className="text-small text-default-500">
            Generate an Excel report of all clinician/clinic relationships
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-6">
        {/* Date Range Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-default-500" />
            <span className="text-sm font-medium">Date Range Filter</span>
          </div>
          <p className="text-xs text-default-400">
            Filter by account creation date (optional)
          </p>

          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="flat" onPress={() => setDateRange(null)}>
              All Time
            </Button>
            <Button size="sm" variant="flat" onPress={() => setDateRange(30)}>
              Last 30 Days
            </Button>
            <Button size="sm" variant="flat" onPress={() => setDateRange(90)}>
              Last 90 Days
            </Button>
            <Button size="sm" variant="flat" onPress={() => setDateRange(365)}>
              Last Year
            </Button>
          </div>

          {/* Custom date inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="From Date"
              placeholder="Start date"
              value={createdFrom}
              onValueChange={setCreatedFrom}
              size="sm"
            />
            <Input
              type="date"
              label="To Date"
              placeholder="End date"
              value={createdTo}
              onValueChange={setCreatedTo}
              size="sm"
            />
          </div>
        </div>

        <Divider />

        {/* Username Filter Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-default-500" />
            <span className="text-sm font-medium">Ignored Usernames</span>
          </div>
          <p className="text-xs text-default-400">
            Enter usernames to exclude from the report (one per line). Useful
            for filtering out test accounts or automated users.
          </p>
          <Textarea
            placeholder="Enter usernames to ignore (one per line)"
            value={ignoredUsernames}
            onValueChange={setIgnoredUsernames}
            minRows={3}
            maxRows={6}
            size="sm"
          />
        </div>

        <Divider />

        {/* Report Contents Info */}
        <div className="bg-default-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Report Contents</p>
          <ul className="text-xs text-default-500 space-y-1 list-disc list-inside">
            <li>User ID</li>
            <li>Username (email)</li>
            <li>Full Name</li>
            <li>Email Verified Status</li>
            <li>Clinic ID</li>
            <li>Clinic Name</li>
            <li>Clinician Role</li>
            <li>Created Time</li>
          </ul>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            color="primary"
            startContent={
              isLoading ? (
                <Spinner size="sm" color="current" />
              ) : (
                <Download className="w-4 h-4" />
              )
            }
            onPress={handleGenerateReport}
            isDisabled={isLoading}
          >
            {isLoading ? 'Generating Report...' : 'Generate Report'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
