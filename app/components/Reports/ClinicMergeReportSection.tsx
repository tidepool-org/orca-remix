import { useState } from 'react';
import { Button, Spinner, Autocomplete, AutocompleteItem } from '@heroui/react';
import { Merge, Download, AlertTriangle, Building2 } from 'lucide-react';
import SectionPanel from '~/components/ui/SectionPanel';
import type { RecentClinic } from '~/components/Clinic/types';

export type ClinicMergeReportSectionProps = {
  onGenerateReport: (
    sourceClinicId: string,
    targetClinicId: string,
  ) => Promise<void>;
  isLoading?: boolean;
  recentClinics?: RecentClinic[];
};

export default function ClinicMergeReportSection({
  onGenerateReport,
  isLoading = false,
  recentClinics = [],
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

  const clinicItems = recentClinics.map((clinic) => ({
    key: clinic.id,
    label: `${clinic.name} (${clinic.id})`,
  }));

  return (
    <SectionPanel
      icon={<Merge className="w-5 h-5" />}
      title="Clinic Merge Report"
      subtitle="Generate a merge analysis report between two clinics"
      aria-label="Clinic merge report section"
    >
      <div className="flex flex-col gap-6">
        {/* Warning Banner */}
        <div className="bg-warning-50 darkTheme:bg-warning-900 border border-warning-200 darkTheme:border-warning-700 rounded-lg p-4 flex gap-3">
          <AlertTriangle
            className="w-5 h-5 text-warning-500 darkTheme:text-warning-400 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="text-sm">
            <p className="font-medium text-warning-700 darkTheme:text-warning-200 mb-1">
              Analysis Report Only
            </p>
            <p className="text-warning-600 darkTheme:text-warning-300">
              This generates a report analyzing what would happen if the source
              clinic is merged into the target clinic. No actual merge is
              performed.
            </p>
          </div>
        </div>

        {/* Clinic IDs Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2
              className="w-4 h-4 text-default-500"
              aria-hidden="true"
            />
            <span className="text-sm font-medium">Clinic IDs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Autocomplete
              label="Source Clinic ID"
              placeholder="Search or enter clinic ID"
              description="The clinic that will be merged FROM (will be empty after merge)"
              size="sm"
              isRequired
              allowsCustomValue
              selectedKey={
                clinicItems.some((c) => c.key === sourceClinicId)
                  ? sourceClinicId
                  : null
              }
              inputValue={sourceClinicId}
              onInputChange={setSourceClinicId}
              onSelectionChange={(key) => {
                if (key !== null) setSourceClinicId(key as string);
              }}
              aria-label="Source clinic ID"
            >
              {clinicItems.map((item) => (
                <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>
              ))}
            </Autocomplete>
            <Autocomplete
              label="Target Clinic ID"
              placeholder="Search or enter clinic ID"
              description="The clinic that will receive all data"
              size="sm"
              isRequired
              allowsCustomValue
              selectedKey={
                clinicItems.some((c) => c.key === targetClinicId)
                  ? targetClinicId
                  : null
              }
              inputValue={targetClinicId}
              onInputChange={setTargetClinicId}
              onSelectionChange={(key) => {
                if (key !== null) setTargetClinicId(key as string);
              }}
              aria-label="Target clinic ID"
            >
              {clinicItems.map((item) => (
                <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>
              ))}
            </Autocomplete>
          </div>
        </div>

        {/* Report Contents Info */}
        <div className="border border-default-200 rounded-lg p-4">
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
                <Download className="w-4 h-4" aria-hidden="true" />
              )
            }
            onPress={handleGenerateReport}
            isDisabled={isLoading || !isValid}
          >
            {isLoading ? 'Generating Report...' : 'Generate Merge Report'}
          </Button>
        </div>
      </div>
    </SectionPanel>
  );
}
