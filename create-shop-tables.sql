-- ====================================================================
-- Shadow Azeroth - Shop Tables
-- Ejecutar contra la base de datos: acore_auth
-- ====================================================================

-- Agregar columnas de moneda a la tabla account
-- (necesarias para que el sistema de compras funcione)
ALTER TABLE `account`
  ADD COLUMN IF NOT EXISTS `vp` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Vote Points',
  ADD COLUMN IF NOT EXISTS `dp` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Donation Points';

-- ====================================================================
-- Tabla principal de la tienda
-- ====================================================================
CREATE TABLE IF NOT EXISTS `shop_items` (
  `id`               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `item_id`          INT UNSIGNED     NOT NULL DEFAULT 0
    COMMENT 'Entrada del item en item_template (para el icono y enlace Wowhead)',
  `name`             VARCHAR(100)     NOT NULL DEFAULT '',
  `image`            VARCHAR(100)     DEFAULT NULL
    COMMENT 'Nombre del icono sin extension (ej: inv_sword_61)',
  `price`            INT UNSIGNED     NOT NULL DEFAULT 0,
  `currency`         ENUM('vp','dp')  NOT NULL DEFAULT 'vp',
  `quality`          ENUM('comun','poco_comun','raro','epico','legendario')
                                      NOT NULL DEFAULT 'comun',
  `category`         ENUM('pve','pvp','misc')
                                      NOT NULL DEFAULT 'misc'
    COMMENT 'Categoria de la tienda',
  `tier`             TINYINT UNSIGNED NOT NULL DEFAULT 0
    COMMENT '0 = sin tier; 1-9 para tiers de PvE',
  `class_mask`       INT UNSIGNED     NOT NULL DEFAULT 0
    COMMENT '0 = todas las clases. Mascara de bits: WAR=1, PAL=2, HUN=4, ROG=8, PRI=16, DK=32, SHA=64, MAG=128, BRU=256, DRU=1024',
  `soap_item_entry`  INT UNSIGNED     DEFAULT NULL
    COMMENT 'Entrada del item para entrega via SOAP (puede ser igual a item_id)',
  `soap_item_count`  TINYINT UNSIGNED NOT NULL DEFAULT 1
    COMMENT 'Cantidad a entregar via SOAP',
  PRIMARY KEY (`id`),
  KEY `idx_category_tier` (`category`, `tier`),
  KEY `idx_class_mask`    (`class_mask`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Shadow Azeroth - Items de la tienda';

-- ====================================================================
-- Datos de ejemplo por tier y clase
-- Reemplaza los item_id por los reales de tu servidor
--
-- Referencia class_mask:
--   Guerrero (WAR) = 1
--   Paladin  (PAL) = 2
--   Cazador  (HUN) = 4
--   Picaro   (ROG) = 8
--   Sacerdote(PRI) = 16
--   DK             = 32
--   Shaman   (SHA) = 64
--   Mago     (MAG) = 128
--   Brujo    (BRU) = 256
--   Druida   (DRU) = 1024
--   Todas las clases  = 0
-- ====================================================================
INSERT INTO `shop_items`
  (`item_id`, `name`, `image`, `price`, `currency`, `quality`, `category`, `tier`, `class_mask`, `soap_item_entry`, `soap_item_count`)
VALUES
-- ─── T7 – Naxxramas / Sartharion / Malygos ──────────────────────────
(40472, 'Cascos de Espaldas Valkirion (T7)', 'inv_helmet_plate_raidwarrior_i_01', 8000, 'vp', 'epico', 'pve', 7, 1,  40472, 1),
(40456, 'Yelmo del Vigilante Nyx (T7)',       'inv_helmet_plate_raidpaladin_i_01', 8000, 'vp', 'epico', 'pve', 7, 2,  40456, 1),
(40448, 'Sombrero del Cazador Naxx (T7)',     'inv_helmet_mail_raidhunter_i_01',   8000, 'vp', 'epico', 'pve', 7, 4,  40448, 1),
(40471, 'Capucha de las Sombras (T7)',        'inv_helmet_leather_raidrogue_i_01', 8000, 'vp', 'epico', 'pve', 7, 8,  40471, 1),
(40440, 'Corona de la Llama de Hueso (T7)',   'inv_helmet_cloth_raidpriest_i_01',  8000, 'vp', 'epico', 'pve', 7, 16, 40440, 1),
(40541, 'Capucha del Caballero Naxx (T7)',    'inv_helmet_plate_raiddeathknight_i_01', 8000, 'vp', 'epico', 'pve', 7, 32, 40541, 1),
(40450, 'Cubierta del Shaman Naxx (T7)',      'inv_helmet_mail_raidshaman_i_01',   8000, 'vp', 'epico', 'pve', 7, 64, 40450, 1),
(40447, 'Sombrero del Arquimago (T7)',        'inv_helmet_cloth_raidmage_i_01',    8000, 'vp', 'epico', 'pve', 7, 128, 40447, 1),
(40453, 'Coronamiento del Tormento (T7)',     'inv_helmet_cloth_raidwarlock_i_01', 8000, 'vp', 'epico', 'pve', 7, 256, 40453, 1),
(40446, 'Capucha de la Naturaleza (T7)',      'inv_helmet_leather_raiddruid_i_01', 8000, 'vp', 'epico', 'pve', 7, 1024, 40446, 1),

-- ─── T8 – Ulduar ─────────────────────────────────────────────────────
(45390, 'Yelmo de Hierro Ulduar (T8 – WAR)',  'inv_helmet_plate_raidwarrior_i_01', 12000, 'vp', 'epico', 'pve', 8, 1,  45390, 1),
(45389, 'Yelmo del Guardián Sagrado (T8 – PAL)', 'inv_helmet_plate_raidpaladin_i_01', 12000, 'vp', 'epico', 'pve', 8, 2, 45389, 1),
(45387, 'Sombrero del Explorador Ulduar (T8 – HUN)', 'inv_helmet_mail_raidhunter_i_01', 12000, 'vp', 'epico', 'pve', 8, 4, 45387, 1),
(45386, 'Capucha del Asesino Ulduar (T8 – ROG)', 'inv_helmet_leather_raidrogue_i_01', 12000, 'vp', 'epico', 'pve', 8, 8, 45386, 1),
(45385, 'Corona del Profeta Ulduar (T8 – PRI)', 'inv_helmet_cloth_raidpriest_i_01', 12000, 'vp', 'epico', 'pve', 8, 16, 45385, 1),
(45392, 'Capucha del Señor DK Ulduar (T8 – DK)', 'inv_helmet_plate_raiddeathknight_i_01', 12000, 'vp', 'epico', 'pve', 8, 32, 45392, 1),
(45391, 'Casco del Shaman Ulduar (T8 – SHA)', 'inv_helmet_mail_raidshaman_i_01', 12000, 'vp', 'epico', 'pve', 8, 64, 45391, 1),
(45384, 'Sombrero del Arcano Ulduar (T8 – MAG)', 'inv_helmet_cloth_raidmage_i_01', 12000, 'vp', 'epico', 'pve', 8, 128, 45384, 1),
(45388, 'Corona del Tormento Ulduar (T8 – BRU)', 'inv_helmet_cloth_raidwarlock_i_01', 12000, 'vp', 'epico', 'pve', 8, 256, 45388, 1),
(45383, 'Capucha del Druida Ulduar (T8 – DRU)', 'inv_helmet_leather_raiddruid_i_01', 12000, 'vp', 'epico', 'pve', 8, 1024, 45383, 1),

-- ─── T9 – Trial of the Crusader ──────────────────────────────────────
(48391, 'Casco del Campeón (T9 – WAR)',   'inv_helmet_plate_raidwarrior_i_01', 18000, 'vp', 'epico', 'pve', 9, 1,  48391, 1),
(48388, 'Yelmo del Campeón (T9 – PAL)',   'inv_helmet_plate_raidpaladin_i_01', 18000, 'vp', 'epico', 'pve', 9, 2,  48388, 1),
(48390, 'Sombrero del Campeón (T9 – HUN)','inv_helmet_mail_raidhunter_i_01',  18000, 'vp', 'epico', 'pve', 9, 4,  48390, 1),
(48393, 'Capucha del Campeón (T9 – ROG)', 'inv_helmet_leather_raidrogue_i_01',18000, 'vp', 'epico', 'pve', 9, 8,  48393, 1),
(48389, 'Corona del Campeón (T9 – PRI)',  'inv_helmet_cloth_raidpriest_i_01',  18000, 'vp', 'epico', 'pve', 9, 16, 48389, 1),
(48394, 'Yelmo DK del Campeón (T9 – DK)', 'inv_helmet_plate_raiddeathknight_i_01', 18000, 'vp', 'epico', 'pve', 9, 32, 48394, 1),
(48396, 'Casco del Campeón (T9 – SHA)',   'inv_helmet_mail_raidshaman_i_01',   18000, 'vp', 'epico', 'pve', 9, 64, 48396, 1),
(48395, 'Sombrero del Campeón (T9 – MAG)','inv_helmet_cloth_raidmage_i_01',    18000, 'vp', 'epico', 'pve', 9, 128, 48395, 1),
(48392, 'Corona del Campeón (T9 – BRU)',  'inv_helmet_cloth_raidwarlock_i_01', 18000, 'vp', 'epico', 'pve', 9, 256, 48392, 1),
(48397, 'Capucha del Campeón (T9 – DRU)', 'inv_helmet_leather_raiddruid_i_01', 18000, 'vp', 'epico', 'pve', 9, 1024, 48397, 1),

-- ─── Emblemas / consumibles PvE (todas las clases) ───────────────────
(49426, 'Emblema de Hielo x25',     'inv_misc_coin_17',           5000,  'vp', 'epico',  'pve', 7, 0, 49426, 25),
(40752, 'Emblema del Valor x25',    'inv_misc_coin_02',           4000,  'vp', 'raro',   'pve', 8, 0, 40752, 25),
(47241, 'Emblema del Triunfo x25',  'inv_misc_coin_16',           6000,  'vp', 'epico',  'pve', 9, 0, 47241, 25),

-- ─── PvP (todas las clases) ───────────────────────────────────────────
(40753, 'Tabardo de Guerra',        'inv_misc_tabardpvp_01',      3000,  'dp', 'raro',   'pvp', 0, 0, 40753, 1),
(52252, 'Reliquia de Gladiador',    'inv_jewelry_trinket_05',     7200,  'vp', 'epico',  'pvp', 0, 0, 52252, 1),
(49623, 'Hoja del Norte Sombrio',   'inv_sword_61',               8500,  'vp', 'legendario', 'pvp', 0, 3, 49623, 1),

-- ─── Misc (todas las clases) ─────────────────────────────────────────
(54811, 'Caja de Gemas Premium',    'inv_misc_gem_variety_01',    2500,  'dp', 'comun',  'misc', 0, 0, 54811, 1),
(47557, 'Daga de Escarcha',         'inv_weapon_shortblade_101',  4200,  'vp', 'epico',  'misc', 0, 8, 47557, 1);
