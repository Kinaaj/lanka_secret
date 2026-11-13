// =====================================================================
// WRECKFEST MAP DATA POOL
// Obsahuje 45 oficiálních lokací/map rozdělených do kategorií
// Pro každou mapu jsou definovány závodní tratě (Tracks) a demoliční arény (Arenas)
// =====================================================================

const WRECKFEST_MAP_CATEGORIES = [
  'Fields',
  'Forest',
  'Sandpit',
  'Urban',
  'Wrecker',
  'Carmageddon',
  'Rally Trophy'
];

const WRECKFEST_MAP_POOL = [
  {
    "id": "bloomfield_speedway",
    "name": "Bloomfield Speedway",
    "category": "Fields",
    "image": "map_picks/wreckfest/bloomfield_speedway.png",
    "tracks": [
      {
        "id": "bloomfield_speedway_dirt_oval",
        "name": "Dirt oval",
        "length": "406 m",
        "surface": "100% dirt",
        "image": "map_picks/wreckfest/tracks/bloomfield_speedway_dirt_oval.png"
      },
      {
        "id": "bloomfield_speedway_figure_8",
        "name": "Figure 8",
        "length": "495 m",
        "surface": "100% dirt",
        "image": "map_picks/wreckfest/tracks/bloomfield_speedway_figure_8.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "bonebreaker_valley",
    "name": "Bonebreaker Valley",
    "category": "Fields",
    "image": "map_picks/wreckfest/bonebreaker_valley.png",
    "tracks": [
      {
        "id": "bonebreaker_valley_main_circuit",
        "name": "Main circuit",
        "length": "848 m",
        "surface": "71% gravel, 29% tarmac",
        "image": "map_picks/wreckfest/tracks/bonebreaker_valley_main_circuit.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "crash_canyon",
    "name": "Crash Canyon",
    "category": "Fields",
    "image": "map_picks/wreckfest/crash_canyon.png",
    "tracks": [
      {
        "id": "crash_canyon_main_circuit",
        "name": "Main circuit",
        "length": "1010 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/crash_canyon_main_circuit.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "dirt_devil_stadium",
    "name": "Dirt Devil Stadium",
    "category": "Fields",
    "image": "map_picks/wreckfest/dirt_devil_stadium.png",
    "tracks": [
      {
        "id": "dirt_devil_stadium_dirt_speedway",
        "name": "Dirt speedway",
        "length": "992 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/dirt_devil_stadium_dirt_speedway.png"
      }
    ],
    "arenas": [
      {
        "id": "dirt_devil_stadium_demolition_arena",
        "name": "Demolition arena",
        "size": "2.33 ha",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/arenas/dirt_devil_stadium_demolition_arena.png"
      }
    ]
  },
  {
    "id": "drytown_desert_circuit",
    "name": "Drytown Desert Circuit",
    "category": "Fields",
    "image": "map_picks/wreckfest/drytown_desert_circuit.png",
    "tracks": [
      {
        "id": "drytown_desert_circuit_main_circuit",
        "name": "Main circuit",
        "length": "960 m",
        "surface": "91% gravel, 9% tarmac",
        "image": "map_picks/wreckfest/tracks/drytown_desert_circuit_main_circuit.png"
      },
      {
        "id": "drytown_desert_circuit_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "960 m",
        "surface": "91% gravel, 9% tarmac",
        "image": "map_picks/wreckfest/tracks/drytown_desert_circuit_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "eagles_peak_motorpark",
    "name": "Eagles Peak Motorpark",
    "category": "Fields",
    "image": "map_picks/wreckfest/eagles_peak_motorpark.png",
    "tracks": [
      {
        "id": "eagles_peak_motorpark_racing_track",
        "name": "Racing track",
        "length": "2010 m",
        "surface": "37% gravel, 63% tarmac",
        "image": "map_picks/wreckfest/tracks/eagles_peak_motorpark_racing_track.png"
      },
      {
        "id": "eagles_peak_motorpark_racing_track_reverse",
        "name": "Racing track reverse",
        "length": "2010 m",
        "surface": "37% gravel, 63% tarmac",
        "image": "map_picks/wreckfest/tracks/eagles_peak_motorpark_racing_track_reverse.png"
      }
    ],
    "arenas": [
      {
        "id": "eagles_peak_motorpark_demolition_arena",
        "name": "Demolition arena",
        "size": "2008 m2",
        "surface": "37% gravel, 63% tarmac",
        "image": "map_picks/wreckfest/arenas/eagles_peak_motorpark_demolition_arena.png"
      }
    ]
  },
  {
    "id": "fairfield_county",
    "name": "Fairfield County",
    "category": "Fields",
    "image": "map_picks/wreckfest/fairfield_county.png",
    "tracks": [],
    "arenas": [
      {
        "id": "fairfield_county_demolition_arena",
        "name": "Demolition arena",
        "size": "6550 m2",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/fairfield_county_demolition_arena.png"
      }
    ]
  },
  {
    "id": "fairfield_grass_field",
    "name": "Fairfield Grass Field",
    "category": "Fields",
    "image": "map_picks/wreckfest/fairfield_grass_field.png",
    "tracks": [],
    "arenas": [
      {
        "id": "fairfield_grass_field_demolition_arena",
        "name": "Demolition arena",
        "size": "6550 m2",
        "surface": "100% dirt",
        "image": "map_picks/wreckfest/arenas/fairfield_grass_field_demolition_arena.png"
      }
    ]
  },
  {
    "id": "fairfield_mud_pit",
    "name": "Fairfield Mud Pit",
    "category": "Fields",
    "image": "map_picks/wreckfest/fairfield_mud_pit.png",
    "tracks": [],
    "arenas": [
      {
        "id": "fairfield_mud_pit_demolition_arena",
        "name": "Demolition arena",
        "size": "1.69 ha",
        "surface": "100% mud",
        "image": "map_picks/wreckfest/arenas/fairfield_mud_pit_demolition_arena.png"
      }
    ]
  },
  {
    "id": "glendale_countryside",
    "name": "Glendale Countryside",
    "category": "Fields",
    "image": "map_picks/wreckfest/glendale_countryside.png",
    "tracks": [],
    "arenas": [
      {
        "id": "glendale_countryside_field_arena",
        "name": "Field arena",
        "size": "1.92 ha",
        "surface": "100% dirt",
        "image": "map_picks/wreckfest/arenas/glendale_countryside_field_arena.png"
      }
    ]
  },
  {
    "id": "kingston_raceway",
    "name": "Kingston Raceway",
    "category": "Fields",
    "image": "map_picks/wreckfest/kingston_raceway.png",
    "tracks": [
      {
        "id": "kingston_raceway_asphalt_oval",
        "name": "Asphalt oval",
        "length": "443 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/kingston_raceway_asphalt_oval.png"
      },
      {
        "id": "kingston_raceway_asphalt_oval_reverse",
        "name": "Asphalt oval reverse",
        "length": "443 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/kingston_raceway_asphalt_oval_reverse.png"
      },
      {
        "id": "kingston_raceway_figure_8",
        "name": "Figure 8",
        "length": "469 m",
        "surface": "20% dirt, 80% tarmac",
        "image": "map_picks/wreckfest/tracks/kingston_raceway_figure_8.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "midwest_motocenter",
    "name": "Midwest Motocenter",
    "category": "Fields",
    "image": "map_picks/wreckfest/midwest_motocenter.png",
    "tracks": [
      {
        "id": "midwest_motocenter_main_circuit",
        "name": "Main circuit",
        "length": "1330 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/midwest_motocenter_main_circuit.png"
      },
      {
        "id": "midwest_motocenter_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1330 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/midwest_motocenter_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "mudford_motorpark",
    "name": "Mudford Motorpark",
    "category": "Fields",
    "image": "map_picks/wreckfest/mudford_motorpark.png",
    "tracks": [
      {
        "id": "mudford_motorpark_mud_oval",
        "name": "Mud oval",
        "length": "383 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/mudford_motorpark_mud_oval.png"
      }
    ],
    "arenas": [
      {
        "id": "mudford_motorpark_mud_pit",
        "name": "Mud pit",
        "size": "1.69 ha",
        "surface": "100% mud",
        "image": "map_picks/wreckfest/arenas/mudford_motorpark_mud_pit.png"
      }
    ]
  },
  {
    "id": "rattlesnake_racepark",
    "name": "Rattlesnake Racepark",
    "category": "Fields",
    "image": "map_picks/wreckfest/rattlesnake_racepark.png",
    "tracks": [
      {
        "id": "rattlesnake_racepark_main_circuit",
        "name": "Main circuit",
        "length": "1670 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/rattlesnake_racepark_main_circuit.png"
      },
      {
        "id": "rattlesnake_racepark_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1670 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/rattlesnake_racepark_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "rockfield_roughspot",
    "name": "Rockfield Roughspot",
    "category": "Fields",
    "image": "map_picks/wreckfest/rockfield_roughspot.png",
    "tracks": [
      {
        "id": "rockfield_roughspot_dirt_oval",
        "name": "Dirt oval",
        "length": "848 m",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/rockfield_roughspot_dirt_oval.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "the_maw",
    "name": "The Maw",
    "category": "Fields",
    "image": "map_picks/wreckfest/the_maw.png",
    "tracks": [],
    "arenas": [
      {
        "id": "the_maw_demolition_arena",
        "name": "Demolition arena",
        "size": "2.11 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/the_maw_demolition_arena.png"
      }
    ]
  },
  {
    "id": "clayridge_circuit",
    "name": "Clayridge Circuit",
    "category": "Forest",
    "image": "map_picks/wreckfest/clayridge_circuit.png",
    "tracks": [
      {
        "id": "clayridge_circuit_main_circuit",
        "name": "Main circuit",
        "length": "1160 m",
        "surface": "65% gravel, 35% tarmac",
        "image": "map_picks/wreckfest/tracks/clayridge_circuit_main_circuit.png"
      },
      {
        "id": "clayridge_circuit_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1160 m",
        "surface": "65% gravel, 35% tarmac",
        "image": "map_picks/wreckfest/tracks/clayridge_circuit_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "espedalen_raceway",
    "name": "Espedalen Raceway",
    "category": "Forest",
    "image": "map_picks/wreckfest/espedalen_raceway.png",
    "tracks": [
      {
        "id": "espedalen_raceway_main_circuit",
        "name": "Main circuit",
        "length": "2280 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/espedalen_raceway_main_circuit.png"
      },
      {
        "id": "espedalen_raceway_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "2280 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/espedalen_raceway_main_circuit_reverse.png"
      },
      {
        "id": "espedalen_raceway_short_circuit",
        "name": "Short circuit",
        "length": "1050 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/espedalen_raceway_short_circuit.png"
      },
      {
        "id": "espedalen_raceway_short_circuit_reverse",
        "name": "Short circuit reverse",
        "length": "1050 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/espedalen_raceway_short_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "finncross_circuit",
    "name": "FinnCross Circuit",
    "category": "Forest",
    "image": "map_picks/wreckfest/finncross_circuit.png",
    "tracks": [
      {
        "id": "finncross_circuit_main_circuit",
        "name": "Main circuit",
        "length": "944 m",
        "surface": "36% gravel, 64% tarmac",
        "image": "map_picks/wreckfest/tracks/finncross_circuit_main_circuit.png"
      },
      {
        "id": "finncross_circuit_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1040 m",
        "surface": "27% gravel, 73% tarmac",
        "image": "map_picks/wreckfest/tracks/finncross_circuit_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "fire_rock_raceway",
    "name": "Fire Rock Raceway",
    "category": "Forest",
    "image": "map_picks/wreckfest/fire_rock_raceway.png",
    "tracks": [
      {
        "id": "fire_rock_raceway_main_circuit",
        "name": "Main circuit",
        "length": "1960 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/fire_rock_raceway_main_circuit.png"
      },
      {
        "id": "fire_rock_raceway_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1960 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/fire_rock_raceway_main_circuit_reverse.png"
      },
      {
        "id": "fire_rock_raceway_short_circuit",
        "name": "Short circuit",
        "length": "1540 m",
        "surface": "14% gravel, 86% tarmac",
        "image": "map_picks/wreckfest/tracks/fire_rock_raceway_short_circuit.png"
      },
      {
        "id": "fire_rock_raceway_short_circuit_reverse",
        "name": "Short circuit reverse",
        "length": "1540 m",
        "surface": "14% gravel, 86% tarmac",
        "image": "map_picks/wreckfest/tracks/fire_rock_raceway_short_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "firwood_motocenter",
    "name": "Firwood Motocenter",
    "category": "Forest",
    "image": "map_picks/wreckfest/firwood_motocenter.png",
    "tracks": [
      {
        "id": "firwood_motocenter_main_circuit",
        "name": "Main circuit",
        "length": "1460 m",
        "surface": "55% gravel, 45% tarmac",
        "image": "map_picks/wreckfest/tracks/firwood_motocenter_main_circuit.png"
      },
      {
        "id": "firwood_motocenter_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1460 m",
        "surface": "55% gravel, 45% tarmac",
        "image": "map_picks/wreckfest/tracks/firwood_motocenter_main_circuit_reverse.png"
      },
      {
        "id": "firwood_motocenter_rally_circuit",
        "name": "Rally circuit",
        "length": "1.52 km",
        "surface": "55% gravel, 45% tarmac",
        "image": "map_picks/wreckfest/tracks/firwood_motocenter_rally_circuit.png"
      },
      {
        "id": "firwood_motocenter_rally_circuit_reverse",
        "name": "Rally circuit reverse",
        "length": "1.52 km",
        "surface": "55% gravel, 45% tarmac",
        "image": "map_picks/wreckfest/tracks/firwood_motocenter_rally_circuit_reverse.png"
      },
      {
        "id": "firwood_motocenter_short_circuit",
        "name": "Short circuit",
        "length": "1090 m",
        "surface": "39% gravel, 61% tarmac",
        "image": "map_picks/wreckfest/tracks/firwood_motocenter_short_circuit.png"
      },
      {
        "id": "firwood_motocenter_short_circuit_reverse",
        "name": "Short circuit reverse",
        "length": "1090 m",
        "surface": "39% gravel, 61% tarmac",
        "image": "map_picks/wreckfest/tracks/firwood_motocenter_short_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "maasten_motocenter",
    "name": "Maasten Motocenter",
    "category": "Forest",
    "image": "map_picks/wreckfest/maasten_motocenter.png",
    "tracks": [
      {
        "id": "maasten_motocenter_main_circuit",
        "name": "Main circuit",
        "length": "1050 m",
        "surface": "42% gravel, 58% tarmac",
        "image": "map_picks/wreckfest/tracks/maasten_motocenter_main_circuit.png"
      },
      {
        "id": "maasten_motocenter_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1050 m",
        "surface": "42% gravel, 58% tarmac",
        "image": "map_picks/wreckfest/tracks/maasten_motocenter_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "northfolk_ring",
    "name": "Northfolk Ring",
    "category": "Forest",
    "image": "map_picks/wreckfest/northfolk_ring.png",
    "tracks": [
      {
        "id": "northfolk_ring_main_circuit",
        "name": "Main circuit",
        "length": "1140 m",
        "surface": "55% gravel, 45% tarmac",
        "image": "map_picks/wreckfest/tracks/northfolk_ring_main_circuit.png"
      },
      {
        "id": "northfolk_ring_open_circuit",
        "name": "Open circuit",
        "length": "1110 m",
        "surface": "58% gravel, 42% tarmac",
        "image": "map_picks/wreckfest/tracks/northfolk_ring_open_circuit.png"
      },
      {
        "id": "northfolk_ring_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1110 m",
        "surface": "56% gravel, 44% tarmac",
        "image": "map_picks/wreckfest/tracks/northfolk_ring_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "northland_raceway",
    "name": "Northland Raceway",
    "category": "Forest",
    "image": "map_picks/wreckfest/northland_raceway.png",
    "tracks": [
      {
        "id": "northland_raceway_outer_route",
        "name": "Outer route",
        "length": "2090 m",
        "surface": "58% gravel, 42% tarmac",
        "image": "map_picks/wreckfest/tracks/northland_raceway_outer_route.png"
      },
      {
        "id": "northland_raceway_outer_route_reverse",
        "name": "Outer route reverse",
        "length": "2090 m",
        "surface": "58% gravel, 42% tarmac",
        "image": "map_picks/wreckfest/tracks/northland_raceway_outer_route_reverse.png"
      },
      {
        "id": "northland_raceway_inner_route",
        "name": "Inner route",
        "length": "2000 m",
        "surface": "58% gravel, 42% tarmac",
        "image": "map_picks/wreckfest/tracks/northland_raceway_inner_route.png"
      },
      {
        "id": "northland_raceway_inner_route_reverse",
        "name": "Inner route reverse",
        "length": "2000 m",
        "surface": "58% gravel, 42% tarmac",
        "image": "map_picks/wreckfest/tracks/northland_raceway_inner_route_reverse.png"
      },
      {
        "id": "northland_raceway_free_route",
        "name": "Free route",
        "length": "2000 m",
        "surface": "68% gravel, 32% tarmac",
        "image": "map_picks/wreckfest/tracks/northland_raceway_free_route.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "pinehills_raceway",
    "name": "Pinehills Raceway",
    "category": "Forest",
    "image": "map_picks/wreckfest/pinehills_raceway.png",
    "tracks": [
      {
        "id": "pinehills_raceway_main_circuit",
        "name": "Main circuit",
        "length": "1810 m",
        "surface": "48% gravel, 52% tarmac",
        "image": "map_picks/wreckfest/tracks/pinehills_raceway_main_circuit.png"
      },
      {
        "id": "pinehills_raceway_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1810 m",
        "surface": "48% gravel, 52% tarmac",
        "image": "map_picks/wreckfest/tracks/pinehills_raceway_main_circuit_reverse.png"
      },
      {
        "id": "pinehills_raceway_rally_circuit",
        "name": "Rally circuit",
        "length": "2240 m",
        "surface": "58% gravel, 42% tarmac",
        "image": "map_picks/wreckfest/tracks/pinehills_raceway_rally_circuit.png"
      },
      {
        "id": "pinehills_raceway_rally_circuit_reverse",
        "name": "Rally circuit reverse",
        "length": "2240 m",
        "surface": "58% gravel, 42% tarmac",
        "image": "map_picks/wreckfest/tracks/pinehills_raceway_rally_circuit_reverse.png"
      },
      {
        "id": "pinehills_raceway_short_circuit",
        "name": "Short circuit",
        "length": "1340 m",
        "surface": "46% gravel, 54% tarmac",
        "image": "map_picks/wreckfest/tracks/pinehills_raceway_short_circuit.png"
      },
      {
        "id": "pinehills_raceway_short_circuit_reverse",
        "name": "Short circuit reverse",
        "length": "1340 m",
        "surface": "46% gravel, 54% tarmac",
        "image": "map_picks/wreckfest/tracks/pinehills_raceway_short_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "rosenheim_raceway",
    "name": "Rosenheim Raceway",
    "category": "Forest",
    "image": "map_picks/wreckfest/rosenheim_raceway.png",
    "tracks": [
      {
        "id": "rosenheim_raceway_main_circuit",
        "name": "Main circuit",
        "length": "1390 m",
        "surface": "61% gravel, 39% tarmac",
        "image": "map_picks/wreckfest/tracks/rosenheim_raceway_main_circuit.png"
      },
      {
        "id": "rosenheim_raceway_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "1390 m",
        "surface": "61% gravel, 39% tarmac",
        "image": "map_picks/wreckfest/tracks/rosenheim_raceway_main_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "torsdalen_circuit",
    "name": "Torsdalen Circuit",
    "category": "Forest",
    "image": "map_picks/wreckfest/torsdalen_circuit.png",
    "tracks": [
      {
        "id": "torsdalen_circuit_main_circuit",
        "name": "Main circuit",
        "length": "873 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/torsdalen_circuit_main_circuit.png"
      },
      {
        "id": "torsdalen_circuit_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "873 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/torsdalen_circuit_main_circuit_reverse.png"
      },
      {
        "id": "torsdalen_circuit_short_circuit",
        "name": "Short circuit",
        "length": "1.03 km",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/torsdalen_circuit_short_circuit.png"
      },
      {
        "id": "torsdalen_circuit_short_circuit_reverse",
        "name": "Short circuit reverse",
        "length": "1.03 km",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/torsdalen_circuit_short_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "tribend_speedway",
    "name": "Tribend Speedway",
    "category": "Forest",
    "image": "map_picks/wreckfest/tribend_speedway.png",
    "tracks": [
      {
        "id": "tribend_speedway_main_circuit",
        "name": "Main circuit",
        "length": "873 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/tribend_speedway_main_circuit.png"
      },
      {
        "id": "tribend_speedway_reverse_circuit",
        "name": "Reverse circuit",
        "length": "876 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/tribend_speedway_reverse_circuit.png"
      },
      {
        "id": "tribend_speedway_wild_circuit",
        "name": "Wild circuit",
        "length": "873 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/tribend_speedway_wild_circuit.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "vale_falls_circuit",
    "name": "Vale Falls Circuit",
    "category": "Forest",
    "image": "map_picks/wreckfest/vale_falls_circuit.png",
    "tracks": [
      {
        "id": "vale_falls_circuit_main_circuit",
        "name": "Main circuit",
        "length": "913 m",
        "surface": "72% gravel, 28% tarmac",
        "image": "map_picks/wreckfest/tracks/vale_falls_circuit_main_circuit.png"
      },
      {
        "id": "vale_falls_circuit_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "939 m",
        "surface": "72% gravel, 28% tarmac",
        "image": "map_picks/wreckfest/tracks/vale_falls_circuit_main_circuit_reverse.png"
      },
      {
        "id": "vale_falls_circuit_short_circuit",
        "name": "Short circuit",
        "length": "789 m",
        "surface": "62% gravel, 38% tarmac",
        "image": "map_picks/wreckfest/tracks/vale_falls_circuit_short_circuit.png"
      },
      {
        "id": "vale_falls_circuit_short_circuit_reverse",
        "name": "Short circuit reverse",
        "length": "809 m",
        "surface": "62% gravel, 38% tarmac",
        "image": "map_picks/wreckfest/tracks/vale_falls_circuit_short_circuit_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "boulder_bank_circuit",
    "name": "Boulder Bank Circuit",
    "category": "Sandpit",
    "image": "map_picks/wreckfest/boulder_bank_circuit.png",
    "tracks": [
      {
        "id": "boulder_bank_circuit_main_route",
        "name": "Main route",
        "length": "2880 m",
        "surface": "76% gravel, 24% tarmac",
        "image": "map_picks/wreckfest/tracks/boulder_bank_circuit_main_route.png"
      },
      {
        "id": "boulder_bank_circuit_main_route_reverse",
        "name": "Main route reverse",
        "length": "2880 m",
        "surface": "76% gravel, 24% tarmac",
        "image": "map_picks/wreckfest/tracks/boulder_bank_circuit_main_route_reverse.png"
      },
      {
        "id": "boulder_bank_circuit_short_route",
        "name": "Short route",
        "length": "2340 m",
        "surface": "72% gravel, 28% tarmac",
        "image": "map_picks/wreckfest/tracks/boulder_bank_circuit_short_route.png"
      },
      {
        "id": "boulder_bank_circuit_short_route_reverse",
        "name": "Short route reverse",
        "length": "2340 m",
        "surface": "72% gravel, 28% tarmac",
        "image": "map_picks/wreckfest/tracks/boulder_bank_circuit_short_route_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "sandstone_raceway",
    "name": "Sandstone Raceway",
    "category": "Sandpit",
    "image": "map_picks/wreckfest/sandstone_raceway.png",
    "tracks": [
      {
        "id": "sandstone_raceway_main_route",
        "name": "Main route",
        "length": "2460 m",
        "surface": "94% gravel, 6% tarmac",
        "image": "map_picks/wreckfest/tracks/sandstone_raceway_main_route.png"
      },
      {
        "id": "sandstone_raceway_main_route_reverse",
        "name": "Main route reverse",
        "length": "2460 m",
        "surface": "94% gravel, 6% tarmac",
        "image": "map_picks/wreckfest/tracks/sandstone_raceway_main_route_reverse.png"
      },
      {
        "id": "sandstone_raceway_short_route",
        "name": "Short route",
        "length": "1600 m",
        "surface": "91% gravel, 9% tarmac",
        "image": "map_picks/wreckfest/tracks/sandstone_raceway_short_route.png"
      },
      {
        "id": "sandstone_raceway_short_route_reverse",
        "name": "Short route reverse",
        "length": "1600 m",
        "surface": "91% gravel, 9% tarmac",
        "image": "map_picks/wreckfest/tracks/sandstone_raceway_short_route_reverse.png"
      },
      {
        "id": "sandstone_raceway_alt_route",
        "name": "Alt route",
        "length": "2540 m",
        "surface": "95% gravel, 5% tarmac",
        "image": "map_picks/wreckfest/tracks/sandstone_raceway_alt_route.png"
      },
      {
        "id": "sandstone_raceway_alt_route_reverse",
        "name": "Alt route reverse",
        "length": "2540 m",
        "surface": "95% gravel, 5% tarmac",
        "image": "map_picks/wreckfest/tracks/sandstone_raceway_alt_route_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "savolax_sandpit",
    "name": "Savolax Sandpit",
    "category": "Sandpit",
    "image": "map_picks/wreckfest/savolax_sandpit.png",
    "tracks": [
      {
        "id": "savolax_sandpit_main_route",
        "name": "Main route",
        "length": "2260 m",
        "surface": "74% gravel, 26% tarmac",
        "image": "map_picks/wreckfest/tracks/savolax_sandpit_main_route.png"
      },
      {
        "id": "savolax_sandpit_main_route_reverse",
        "name": "Main route reverse",
        "length": "2260 m",
        "surface": "74% gravel, 26% tarmac",
        "image": "map_picks/wreckfest/tracks/savolax_sandpit_main_route_reverse.png"
      },
      {
        "id": "savolax_sandpit_short_route",
        "name": "Short route",
        "length": "1080 m",
        "surface": "82% gravel, 18% tarmac",
        "image": "map_picks/wreckfest/tracks/savolax_sandpit_short_route.png"
      },
      {
        "id": "savolax_sandpit_short_route_reverse",
        "name": "Short route reverse",
        "length": "1080 m",
        "surface": "82% gravel, 18% tarmac",
        "image": "map_picks/wreckfest/tracks/savolax_sandpit_short_route_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "big_valley_speedway",
    "name": "Big Valley Speedway",
    "category": "Urban",
    "image": "map_picks/wreckfest/big_valley_speedway.png",
    "tracks": [
      {
        "id": "big_valley_speedway_figure_8",
        "name": "Figure 8",
        "length": "670 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/big_valley_speedway_figure_8.png"
      },
      {
        "id": "big_valley_speedway_inner_oval",
        "name": "Inner oval",
        "length": "562 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/big_valley_speedway_inner_oval.png"
      },
      {
        "id": "big_valley_speedway_outer_oval",
        "name": "Outer oval",
        "length": "756 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/big_valley_speedway_outer_oval.png"
      },
      {
        "id": "big_valley_speedway_outer_oval_loop",
        "name": "Outer oval loop",
        "length": "1650 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/big_valley_speedway_outer_oval_loop.png"
      }
    ],
    "arenas": [
      {
        "id": "big_valley_speedway_open_demolition_arena",
        "name": "Open Demolition arena",
        "size": "5.81 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/big_valley_speedway_open_demolition_arena.png"
      },
      {
        "id": "big_valley_speedway_demolition_arena",
        "name": "Demolition arena",
        "size": "5.81 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/big_valley_speedway_demolition_arena.png"
      }
    ]
  },
  {
    "id": "deathloop",
    "name": "Deathloop",
    "category": "Urban",
    "image": "map_picks/wreckfest/deathloop.png",
    "tracks": [
      {
        "id": "deathloop_main_circuit",
        "name": "Main circuit",
        "length": "1180 m",
        "surface": "78% tarmac, 22% wood",
        "image": "map_picks/wreckfest/tracks/deathloop_main_circuit.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "hellride",
    "name": "Hellride",
    "category": "Urban",
    "image": "map_picks/wreckfest/hellride.png",
    "tracks": [
      {
        "id": "hellride_main_circuit",
        "name": "Main circuit",
        "length": "1610 m",
        "surface": "78% tarmac, 22% wood",
        "image": "map_picks/wreckfest/tracks/hellride_main_circuit.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "hillstreet_circuit",
    "name": "Hillstreet Circuit",
    "category": "Urban",
    "image": "map_picks/wreckfest/hillstreet_circuit.png",
    "tracks": [
      {
        "id": "hillstreet_circuit_race_track",
        "name": "Race track",
        "length": "1710 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/hillstreet_circuit_race_track.png"
      },
      {
        "id": "hillstreet_circuit_race_track_reverse",
        "name": "Race track reverse",
        "length": "1710 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/hillstreet_circuit_race_track_reverse.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "hilltop_stadium",
    "name": "Hilltop Stadium",
    "category": "Urban",
    "image": "map_picks/wreckfest/hilltop_stadium.png",
    "tracks": [
      {
        "id": "hilltop_stadium_figure_8",
        "name": "Figure 8",
        "length": "1010 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/hilltop_stadium_figure_8.png"
      },
      {
        "id": "hilltop_stadium_oval",
        "name": "Oval",
        "length": "820 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/hilltop_stadium_oval.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "madman_stadium",
    "name": "Madman Stadium",
    "category": "Urban",
    "image": "map_picks/wreckfest/madman_stadium.png",
    "tracks": [
      {
        "id": "madman_stadium_figure_8",
        "name": "Figure 8",
        "length": "454 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/madman_stadium_figure_8.png"
      }
    ],
    "arenas": [
      {
        "id": "madman_stadium_demolition_arena",
        "name": "Demolition arena",
        "size": "2.11 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/madman_stadium_demolition_arena.png"
      }
    ]
  },
  {
    "id": "motorcity_circuit",
    "name": "Motorcity Circuit",
    "category": "Urban",
    "image": "map_picks/wreckfest/motorcity_circuit.png",
    "tracks": [
      {
        "id": "motorcity_circuit_main_circuit",
        "name": "Main circuit",
        "length": "2940 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/motorcity_circuit_main_circuit.png"
      },
      {
        "id": "motorcity_circuit_main_circuit_reverse",
        "name": "Main circuit reverse",
        "length": "2940 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/motorcity_circuit_main_circuit_reverse.png"
      },
      {
        "id": "motorcity_circuit_trophy_circuit",
        "name": "Trophy circuit",
        "length": "2940 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/motorcity_circuit_trophy_circuit.png"
      }
    ],
    "arenas": []
  },
  {
    "id": "thunderbowl",
    "name": "Thunderbowl",
    "category": "Urban",
    "image": "map_picks/wreckfest/thunderbowl.png",
    "tracks": [],
    "arenas": [
      {
        "id": "thunderbowl_demolition_arena",
        "name": "Demolition arena",
        "size": "2.52 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/thunderbowl_demolition_arena.png"
      }
    ]
  },
  {
    "id": "wrecknado",
    "name": "Wrecknado",
    "category": "Urban",
    "image": "map_picks/wreckfest/wrecknado.png",
    "tracks": [
      {
        "id": "wrecknado_main_circuit",
        "name": "Main circuit",
        "length": "778 m",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/tracks/wrecknado_main_circuit.png"
      }
    ],
    "arenas": [
      {
        "id": "wrecknado_demolition_arena",
        "name": "Demolition arena",
        "size": "2.52 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/wrecknado_demolition_arena.png"
      }
    ]
  },
  {
    "id": "wrecking_playground",
    "name": "Wrecking Playground",
    "category": "Wrecker",
    "image": "map_picks/wreckfest/wrecking_playground.png",
    "tracks": [],
    "arenas": [
      {
        "id": "wrecking_playground_main_area",
        "name": "Main area",
        "size": "1120 ha",
        "surface": "56% dirt, 44% tarmac",
        "image": "map_picks/wreckfest/arenas/wrecking_playground_main_area.png"
      }
    ]
  },
  {
    "id": "bleak_city",
    "name": "Bleak City",
    "category": "Carmageddon",
    "image": "map_picks/wreckfest/bleak_city.png",
    "tracks": [
      {
        "id": "bleak_city_race_track",
        "name": "Race Track",
        "length": "3.44 km",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/bleak_city_race_track.png"
      },
      {
        "id": "bleak_city_race_track_reverse",
        "name": "Race Track Reverse",
        "length": "3.44 km",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/bleak_city_race_track_reverse.png"
      }
    ],
    "arenas": [
      {
        "id": "bleak_city_free_roam",
        "name": "Free Roam",
        "size": "2.52 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/bleak_city_free_roam.png"
      },
      {
        "id": "bleak_city_demolition_arena",
        "name": "Demolition Arena",
        "size": "2.52 ha",
        "surface": "100% tarmac",
        "image": "map_picks/wreckfest/arenas/bleak_city_demolition_arena.png"
      }
    ]
  },
  {
    "id": "devils_canyon",
    "name": "Devil's Canyon",
    "category": "Carmageddon",
    "image": "map_picks/wreckfest/devils_canyon.png",
    "tracks": [
      {
        "id": "devils_canyon_race_track",
        "name": "Race Track",
        "length": "2.62 km",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/devils_canyon_race_track.png"
      }
    ],
    "arenas": [
      {
        "id": "devils_canyon_free_roam",
        "name": "Free Roam",
        "size": "2623 m2",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/arenas/devils_canyon_free_roam.png"
      }
    ]
  },
  {
    "id": "rally_trophy",
    "name": "Rally Trophy",
    "category": "Rally Trophy",
    "image": "map_picks/wreckfest/rally_trophy.png",
    "tracks": [
      {
        "id": "rally_trophy_special_stage",
        "name": "Special Stage",
        "length": "11.98 km",
        "surface": "100% gravel",
        "image": "map_picks/wreckfest/tracks/rally_trophy_special_stage.png"
      }
    ],
    "arenas": []
  }
];

// Pomocné funkce pro filtrování a vyhledávání
function getWreckfestMapById(mapId) {
  return WRECKFEST_MAP_POOL.find(m => m.id === mapId) || null;
}

function getWreckfestMapsByCategory(category) {
  return WRECKFEST_MAP_POOL.filter(m => m.category === category);
}

function getAllWreckfestTracks() {
  const allTracks = [];
  WRECKFEST_MAP_POOL.forEach(m => {
    m.tracks.forEach(t => {
      allTracks.push({ ...t, mapId: m.id, mapName: m.name, category: m.category });
    });
  });
  return allTracks;
}

function getAllWreckfestArenas() {
  const allArenas = [];
  WRECKFEST_MAP_POOL.forEach(m => {
    m.arenas.forEach(a => {
      allArenas.push({ ...a, mapId: m.id, mapName: m.name, category: m.category });
    });
  });
  return allArenas;
}

// Export pro Node i browser prostředí
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WRECKFEST_MAP_CATEGORIES,
    WRECKFEST_MAP_POOL,
    getWreckfestMapById,
    getWreckfestMapsByCategory,
    getAllWreckfestTracks,
    getAllWreckfestArenas
  };
}
