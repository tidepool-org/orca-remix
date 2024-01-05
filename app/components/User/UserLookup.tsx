import { Form, useSearchParams } from '@remix-run/react';
import { Input, Button, RadioGroup, Radio } from '@nextui-org/react';
import { UserCircle2Icon } from 'lucide-react';
import find from 'lodash/find';
import map from 'lodash/map';
import React from 'react';
import Well from '~/partials/Well';

type searchOption = {
  key: 'email' | 'userId';
  label: string;
};

export default function UserLookup() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchOptions: searchOption[] = [
    { key: 'userId', label: 'User ID' },
    { key: 'email', label: 'Email Address' },
  ];

  const searchBy: searchOption['key'] = (searchParams.get('userSearchBy') ||
    'userId') as searchOption['key'];

  const search = searchParams.get('search');
  const [searchValue, setSearchValue] = React.useState(search);

  React.useEffect(() => {
    setSearchValue(search || '');
  }, [search]);

  const handleSearchByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => {
      const prevSearchBy = prev.get('userSearchBy');
      if (prevSearchBy !== e.target.value) {
        prev.set('userSearchBy', e.target.value);
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
    type: searchBy === 'email' ? 'email' : 'text',
    label: find(searchOptions, { key: searchBy })?.label,
    value: searchValue || '',
    onChange: handleSearchChange,
  };

  return (
    <Form action="/users">
      <Well>
        <div className="flex gap-2">
          <UserCircle2Icon />
          <h2 className="text-lg font-semibold">User Lookup</h2>
        </div>

        <RadioGroup
          label="Search By:"
          orientation="horizontal"
          value={searchBy}
          onChange={handleSearchByChange}
          name="userSearchBy"
          classNames={{ base: 'flex-row' }}
        >
          {map(searchOptions, ({ label, key }) => (
            <Radio
              key={key}
              value={key}
              classNames={{ wrapper: 'bg-background' }}
            >
              {label}
            </Radio>
          ))}
        </RadioGroup>

        <div className="flex items-center gap-4">
          <Input
            {...inputProps}
            className="max-w-xs"
            classNames={{
              inputWrapper: 'lightTheme:bg-background',
              input: 'group-data-[has-value=true]:text-content1-foreground',
            }}
          />
        </div>

        <div>
          <Button type="submit" color="primary">
            Search
          </Button>
        </div>
      </Well>
    </Form>
  );
}
