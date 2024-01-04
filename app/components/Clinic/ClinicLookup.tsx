import { Form, useSearchParams } from '@remix-run/react';
import { Input, Button, RadioGroup, Radio } from '@nextui-org/react';
import { Cross } from 'lucide-react';
import find from 'lodash/find';
import map from 'lodash/map';
import React from 'react';

type searchOption = {
  key: 'shareCode' | 'clinicId';
  label: string;
};

export default function ClinicLookup() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchOptions: searchOption[] = [
    { key: 'clinicId', label: 'Clinic ID' },
    { key: 'shareCode', label: 'Share Code' },
  ];

  const searchBy: searchOption['key'] = (searchParams.get('clinicSearchBy') ||
    'clinicId') as searchOption['key'];

  const search = searchParams.get('search');
  const [searchValue, setSearchValue] = React.useState(search);

  React.useEffect(() => {
    setSearchValue(search || '');
  }, [search]);

  const handleSearchByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => {
      const prevSearchBy = prev.get('clinicSearchBy');
      if (prevSearchBy !== e.target.value) {
        prev.set('clinicSearchBy', e.target.value);
        prev.delete('search');
        setSearchValue('');
      }
      return prev;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const inputProps = {
    name: 'search',
    type: 'text',
    label: find(searchOptions, { key: searchBy })?.label,
    value: searchValue || '',
    onChange: handleSearchChange,
  };

  return (
    <Form
      action="/clinics"
      className="flex flex-col p-6 lg:p-8 bg-content1 text-content1-foreground rounded-xl gap-4"
    >
      <div className="flex gap-2">
        <Cross />
        <h2 className="text-lg font-semibold">Clinic Lookup</h2>
      </div>

      <RadioGroup
        label="Search By:"
        orientation="horizontal"
        value={searchBy}
        onChange={handleSearchByChange}
        name="clinicSearchBy"
        classNames={{ base: 'flex-row' }}
      >
        {map(searchOptions, ({ label, key }) => (
          <Radio key={key} value={key}>
            {label}
          </Radio>
        ))}
      </RadioGroup>

      <div className="flex items-center gap-4">
        <Input
          {...inputProps}
          className="max-w-xs"
          classNames={{
            inputWrapper: 'bg-white darkTheme:bg-content3',
            input: 'group-data-[has-value=true]:text-content1-foreground',
          }}
        />
      </div>

      <div>
        <Button type="submit" color="primary">
          Search
        </Button>
      </div>
    </Form>
  );
}
