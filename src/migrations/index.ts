import * as migration_20261007_150433_initial from './20261007_150433_initial';
import * as migration_20261007_154713_add_numero_maglia from './20261007_154713_add_numero_maglia';
import * as migration_20261030_094718_add_prenotazioni from './20261030_094718_add_prenotazioni';
import * as migration_20261030_095550_add_prossima_partita from './20261030_095550_add_prossima_partita';
import * as migration_20261030_114700_add_push from './20261030_114700_add_push';
import * as migration_20261030_123736_add_cloud_storage from './20261030_123736_add_cloud_storage';
import * as migration_20261101_135810_add_comunicazioni from './20261101_135810_add_comunicazioni';

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
    name: '20261030_095550_add_prossima_partita',
  },
  {
    up: migration_20261030_114700_add_push.up,
    down: migration_20261030_114700_add_push.down,
    name: '20261030_114700_add_push',
  },
  {
    up: migration_20261030_123736_add_cloud_storage.up,
    down: migration_20261030_123736_add_cloud_storage.down,
    name: '20261030_123736_add_cloud_storage',
  },
  {
    up: migration_20261101_135810_add_comunicazioni.up,
    down: migration_20261101_135810_add_comunicazioni.down,
    name: '20261101_135810_add_comunicazioni'
  },
];
