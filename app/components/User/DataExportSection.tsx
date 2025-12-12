import { useState } from 'react';
import { Button, Select, SelectItem, RadioGroup, Radio } from '@heroui/react';
import { Download, Calendar, FileSpreadsheet, FileJson } from 'lucide-react';
import { subDays, format } from 'date-fns';
import SectionPanel from '~/components/ui/SectionPanel';

export type DataExportSectionProps = {
  userId: string;
};

type DateRangeOption = 'all' | '90days' | '30days' | '14days';
type ExportFormat = 'xlsx' | 'json';
type BgUnits = 'mg/dL' | 'mmol/L';

export default function DataExportSection({ userId }: DataExportSectionProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [bgUnits, setBgUnits] = useState<BgUnits>('mg/dL');
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const endDate = format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'");

    switch (dateRange) {
      case '14days':
        return {
          startDate: format(subDays(now, 14), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          endDate,
        };
      case '30days':
        return {
          startDate: format(subDays(now, 30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          endDate,
        };
      case '90days':
        return {
          startDate: format(subDays(now, 90), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          endDate,
        };
      case 'all':
      default:
        return {};
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const { startDate, endDate } = getDateRange();

      // Build query parameters
      const params = new URLSearchParams();
      params.set('format', exportFormat);
      params.set('bgUnits', bgUnits);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      // Use a resource route for the export
      const exportUrl = `/users/${userId}/export?${params.toString()}`;

      // Open in new tab for download
      window.open(exportUrl, '_blank');
    } finally {
      setIsExporting(false);
    }
  };

  const dateRangeOptions = [
    { key: 'all', label: 'All Data' },
    { key: '90days', label: 'Last 90 Days' },
    { key: '30days', label: 'Last 30 Days' },
    { key: '14days', label: 'Last 14 Days' },
  ];

  return (
    <SectionPanel
      icon={<Download className="w-5 h-5" />}
      title="Export User Data"
      subtitle="Download diabetes data in Excel or JSON format"
      aria-label="Export user data section"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Selection */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Date Range
            </span>
            <Select
              selectedKeys={[dateRange]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as DateRangeOption;
                if (selected) setDateRange(selected);
              }}
              size="sm"
              aria-label="Select date range"
            >
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Export Format */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Export Format</span>
            <RadioGroup
              orientation="horizontal"
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              size="sm"
              aria-label="Export format"
            >
              <Radio value="xlsx">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                  Excel
                </span>
              </Radio>
              <Radio value="json">
                <span className="flex items-center gap-1">
                  <FileJson className="w-4 h-4" aria-hidden="true" />
                  JSON
                </span>
              </Radio>
            </RadioGroup>
          </div>

          {/* BG Units */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Blood Glucose Units</span>
            <RadioGroup
              orientation="horizontal"
              value={bgUnits}
              onValueChange={(value) => setBgUnits(value as BgUnits)}
              size="sm"
              aria-label="Blood glucose units"
            >
              <Radio value="mg/dL">mg/dL</Radio>
              <Radio value="mmol/L">mmol/L</Radio>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            color="primary"
            startContent={<Download className="w-4 h-4" aria-hidden="true" />}
            onPress={handleExport}
            isLoading={isExporting}
          >
            {isExporting ? 'Preparing Export...' : 'Export Data'}
          </Button>
        </div>
      </div>
    </SectionPanel>
  );
}
