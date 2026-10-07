import * as migration_20261007_150433_initial from './20261007_150433_initial';
import * as migration_20261007_154713_add_numero_maglia from './20261007_154713_add_numero_maglia';

export const migrations = [
  {
    up: migration_20261007_150433_initial.up,
    down: migration_20261007_150433_initial.down,
    name: '20261007_150433_initial',
  },
  {
    up: migration_20261007_154713_add_numero_maglia.up,
    down: migration_20261007_154713_add_numero_maglia.down,
    name: '20261007_154713_add_numero_maglia'
  },
];
