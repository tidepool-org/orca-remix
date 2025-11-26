import { Form, useSearchParams } from '@remix-run/react';
import { Input, Button } from '@nextui-org/react';
import { UserCircle2Icon } from 'lucide-react';
import React from 'react';
import Well from '~/partials/Well';

export default function UserLookup() {
  const [searchParams] = useSearchParams();

  const search = searchParams.get('search');
  const [searchValue, setSearchValue] = React.useState(search);

  React.useEffect(() => {
    setSearchValue(search || '');
  }, [search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <Form action="/users">
      <Well>
        <div className="flex gap-2">
          <UserCircle2Icon />
          <h2 className="text-lg font-semibold">User Lookup</h2>
        </div>

        <div className="flex items-center gap-4">
          <Input
            name="search"
            type="text"
            label="User ID or Email Address"
            value={searchValue || ''}
            onChange={handleSearchChange}
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
