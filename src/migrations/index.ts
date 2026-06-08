import * as migration_20260608_072154_add_attended_to_registrations from './20260608_072154_add_attended_to_registrations';
import * as migration_20260608_080255_add_locationLink_and_direction_to_events from './20260608_080255_add_locationLink_and_direction_to_events';

export const migrations = [
  {
    up: migration_20260608_072154_add_attended_to_registrations.up,
    down: migration_20260608_072154_add_attended_to_registrations.down,
    name: '20260608_072154_add_attended_to_registrations',
  },
  {
    up: migration_20260608_080255_add_locationLink_and_direction_to_events.up,
    down: migration_20260608_080255_add_locationLink_and_direction_to_events.down,
    name: '20260608_080255_add_locationLink_and_direction_to_events'
  },
];
