import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Input,
  Spinner,
} from '@heroui/react';
import { Merge, Download, AlertTriangle, Building2 } from 'lucide-react';

export type ClinicMergeReportSectionProps = {
  onGenerateReport: (
    sourceClinicId: string,
    targetClinicId: string,
  ) => Promise<void>;
  isLoading?: boolean;
};

export default function ClinicMergeReportSection({
  onGenerateReport,
  isLoading = false,
}: ClinicMergeReportSectionProps) {
  const [sourceClinicId, setSourceClinicId] = useState<string>('');
  const [targetClinicId, setTargetClinicId] = useState<string>('');

  const handleGenerateReport = async () => {
    if (!sourceClinicId.trim() || !targetClinicId.trim()) {
      return;
    }
    await onGenerateReport(sourceClinicId.trim(), targetClinicId.trim());
  };

  const isValid = sourceClinicId.trim() && targetClinicId.trim();

  return (
    <Card className="w-full" shadow="none">
      <CardHeader className="flex gap-3">
        <Merge className="w-5 h-5 text-primary" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">Clinic Merge Report</p>
          <p className="text-small text-default-500">
            Generate a merge analysis report between two clinics
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-6">
        {/* Warning Banner */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning-700 mb-1">
              Analysis Report Only
            </p>
            <p className="text-warning-600">
              This generates a report analyzing what would happen if the source
              clinic is merged into the target clinic. No actual merge is
              performed.
            </p>
          </div>
        </div>

        {/* Clinic IDs Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-default-500" />
            <span className="text-sm font-medium">Clinic IDs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Source Clinic ID"
              placeholder="Enter source clinic ID"
              description="The clinic that will be merged FROM (will be empty after merge)"
              value={sourceClinicId}
              onValueChange={setSourceClinicId}
              size="sm"
              isRequired
            />
            <Input
              label="Target Clinic ID"
              placeholder="Enter target clinic ID"
              description="The clinic that will receive all data"
              value={targetClinicId}
              onValueChange={setTargetClinicId}
              size="sm"
              isRequired
            />
          </div>
        </div>

        <Divider />

        {/* Report Contents Info */}
        <div className="bg-default-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Report Contents</p>
          <p className="text-xs text-default-500 mb-3">
            The merge analysis report includes:
          </p>
          <ul className="text-xs text-default-500 space-y-1 list-disc list-inside">
            <li>Source clinic details (name, ID, patient count)</li>
            <li>Target clinic details (name, ID, patient count)</li>
            <li>Patients that will be transferred</li>
            <li>Clinicians that will be transferred</li>
            <li>Patient tags that will be merged</li>
            <li>Share codes that will be transferred</li>
            <li>Potential conflicts or duplicates</li>
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
            isDisabled={isLoading || !isValid}
          >
            {isLoading ? 'Generating Report...' : 'Generate Merge Report'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
