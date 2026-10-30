import * as migration_20261007_150433_initial from './20261007_150433_initial';
import * as migration_20261007_154713_add_numero_maglia from './20261007_154713_add_numero_maglia';
import * as migration_20261030_094718_add_prenotazioni from './20261030_094718_add_prenotazioni';
import * as migration_20261030_095550_add_prossima_partita from './20261030_095550_add_prossima_partita';

export const migrations = [
  {
    up: migration_20261007_150433_initial.up,
    down: migration_20261007_150433_initial.down,
    name: '20261007_150433_initial',
  },
  {
    up: migration_20261007_154713_add_numero_maglia.up,
    down: migration_20261007_154713_add_numero_maglia.down,
    name: '20261007_154713_add_numero_maglia',
  },
  {
    up: migration_20261030_094718_add_prenotazioni.up,
    down: migration_20261030_094718_add_prenotazioni.down,
    name: '20261030_094718_add_prenotazioni',
  },
  {
    up: migration_20261030_095550_add_prossima_partita.up,
    down: migration_20261030_095550_add_prossima_partita.down,
    name: '20261030_095550_add_prossima_partita'
  },
];
