import {
  getObjectsByPrototype,
  findClosestByPath,
  createConstructionSite,
} from "/game/utils";
import {
  Creep,
  StructureTower,
  StructureContainer,
  StructureSpawn,
  Source,
  ConstructionSite,
} from "/game/prototypes";
import {
  ERR_NOT_IN_RANGE,
  OK,
  ATTACK,
  CARRY,
  RANGED_ATTACK,
  HEAL,
  RESOURCE_ENERGY,
  MOVE,
  WORK,
  TOUGH,
} from "/game/constants";
import {} from "/arena";
import { testArray } from "./test";

let spawn;
let enemySpawn;
let sources;

const creepBuilds = {
  harvester: {
    bodyParts: [MOVE, MOVE, CARRY, WORK],
    role: "harvester",
  },
  tank: {
    bodyParts: [MOVE, MOVE, ATTACK],
    role: "tank",
  },
  healer: {
    bodyParts: [MOVE, MOVE, HEAL, HEAL],
    role: "healer",
  },
  ranged: {
    bodyParts: [MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK],
    role: "ranged",
  },
};

export function loop() {
  if (!spawn) spawn = getObjectsByPrototype(StructureSpawn).find((i) => i.my);
  if (!enemySpawn)
    enemySpawn = getObjectsByPrototype(StructureSpawn).find((i) => !i.my);
  if (!sources) sources = getObjectsByPrototype(Source);
  console.log(testArray);
  const containers = getObjectsByPrototype(StructureContainer).filter(
    (i) => i.store[RESOURCE_ENERGY] > 0
  );

  const enemyCreeps = getObjectsByPrototype(Creep).filter((i) => !i.my);
  const creeps = getObjectsByPrototype(Creep).filter((i) => i.my);
  const harvesterCreeps = getObjectsByPrototype(Creep).filter(
    (i) => i.my && i.role === "harvester"
  );
  const tankCreeps = getObjectsByPrototype(Creep).filter(
    (i) => i.my && i.role === "tank"
  );
  const healerCreeps = getObjectsByPrototype(Creep).filter(
    (i) => i.my && i.role === "healer"
  );
  const rangedCreeps = getObjectsByPrototype(Creep).filter(
    (i) => i.my && i.role === "ranged"
  );

  if (harvesterCreeps.length < 2) {
    const creep = spawn.spawnCreep(creepBuilds.harvester.bodyParts).object;
    if (creep !== undefined) {
      creep.role = creepBuilds.harvester.role;
      creep.working = false;
    }
  } else if (tankCreeps.length < 10) {
    const creep = spawn.spawnCreep(creepBuilds.tank.bodyParts).object;
    if (creep !== undefined) creep.role = creepBuilds.tank.role;
    // } else if (healerCreeps < 1) {
    //     const creep = spawn.spawnCreep(creepBuilds.healer.bodyPart4).object
    //     if (creep !== undefined) creep.role = creepBuilds.healer.role
    // } else if (rangedCreeps < 1) {
    //     const creep = spawn.spawnCreep(creepBuilds.ranged.bodyPart4).object
    //     if (creep !== undefined) creep.role = creepBuilds.ranged.role
  }

  harvesterCreeps.forEach((creep) => runHarvester(creep, containers, spawn));

  tankCreeps.forEach((creep) =>
    meleeAttack(creep, findClosestByPath(creep, enemyCreeps))
  );
  tankCreeps.forEach((creep) => spawnAttack(creep, enemySpawn));

  rangedCreeps.forEach((creep) =>
    rangedAttack(creep, findClosestByPath(creep, enemyCreeps))
  );
  healerCreeps.forEach((creep) => heal(creep, creeps, tankCreeps));
}

const meleeAttack = (creep, enemyCreep) => {
  console.log(creep.attack(enemyCreep), "im attacking");
  if (creep.attack(enemyCreep) == ERR_NOT_IN_RANGE) {
    creep.moveTo(enemyCreep);
  }
};

const spawnAttack = (creep, enemySpawn) => {
  //   console.log(creep.attack(enemySpawn), "im attacking");
  if (creep.attack(enemySpawn) == ERR_NOT_IN_RANGE) {
    creep.moveTo(enemySpawn);
  }
};

export function harvestEnergy(creep, sources) {
  const source = findClosestByPath(creep, sources);
  if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  }
}

export function harvestContainer(creep, sources) {
  const source = findClosestByPath(creep, sources);
  if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  }
}

const depositEnergy = (creep, spawn) => {
  if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn);
  }
};

const runHarvester = (creep, sources, spawn) => {
  if (creep === undefined) return;
  isWorkingCheck(creep);
  if (creep.working) {
    depositEnergy(creep, spawn);
  } else {
    // harvestEnergy(creep, sources);
    harvestContainer(creep, sources);
  }
};

const isWorkingCheck = (creep) => {
  if (creep === undefined) return;
  if (creep.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.working = false;
  } else if (!creep.working && creep.store.getFreeCapacity() === 0) {
    creep.working = true;
  }
};
