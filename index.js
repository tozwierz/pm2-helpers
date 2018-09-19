#!/usr/bin/env node
const pm2 = require('pm2');

const [,, ...args] = process.argv;
const intervalTimems = 1000;

let ecosystemFile = args[0];

let ecosystemApps;

/**
 * Checks if required paremetr (ecosystem) was given
 * @param argument String
 */
const argumentCheck = (argument) => {
  if (!argument) {
    // eslint-disable-next-line no-console
    console.log (`Usage: pm2-remove-helper <your ecosystem.config.js>`);
    process.exit(2);
  }
};

/**
 * Dynamicaly load ecosystem
 * @param file String
 */
const loadEcosystem = (file) => {
  try {
    ecosystemApps = require(file).apps;
  } catch (e) {
    try {
      ecosystemApps = require(`${process.cwd()}/${file}`).apps;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log (`There is a problem with Ecosystem file: ${file}`);
      process.exit(2);
    }
  }
};

/**
 * Gets names out of processes array
 * @param processes Array
 * @return Array
 */
const getNames = processes => processes.reduce((acc, curr) => {
  acc.push(curr.name);
  return acc;
}, []);

/**
 * Get items from first array which are not in second
 * @param firstArray Array
 * @param secondArray Array
 * @return Array
 */
const getNotInSecondArray = (firstArray, secondArray) => firstArray
  .filter(item => secondArray.indexOf(item) === -1);


/**
 * Removes all given PM2 processes and then disconnect
 * Hack for PM2 "callbacks" which are returned instantly
 * @param list Array
 */
const pm2RemoveAll = (list) => {
  const timerId = setInterval(() => {
    const item = list.pop();
    if (item) {
      // eslint-disable-next-line no-console
      console.log(`Stopping PM2 process: ${item}...`);
      pm2.delete(item);
    } else {
      // eslint-disable-next-line no-console
      pm2.disconnect();
      console.log('Done');
      clearInterval(timerId);
    }
  }, intervalTimems);
};



/**
 *  Main program
 */
(() => {
  argumentCheck(ecosystemFile);
  loadEcosystem(ecosystemFile);

  pm2.connect((error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('The is a problem connecting to PM2');
      process.exit(2);
    }

    pm2.list((err, processes) => {
      const pm2RunningNames = getNames(processes);
      const pm2EcosytemNames = getNames(ecosystemApps);

      const pm2ToStop = getNotInSecondArray(pm2RunningNames, pm2EcosytemNames);

      pm2RemoveAll(pm2ToStop);
    });
  });
})();
