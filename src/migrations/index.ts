import * as migration_20260608_072154_add_attended_to_registrations from './20260608_072154_add_attended_to_registrations';

export const migrations = [
  {
    up: migration_20260608_072154_add_attended_to_registrations.up,
    down: migration_20260608_072154_add_attended_to_registrations.down,
    name: '20260608_072154_add_attended_to_registrations'
  },
];
