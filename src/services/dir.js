"use strict";

import rimraf from "rimraf";
import glob from "glob";

const readDir = ({ path, settings }) => new Promise((resolve, reject) => {
  glob(`${path}/*.md`, settings, (err, matches) => {
    if (err) reject(new Error(`Failed to read dir by path: ${path}. Error: ${err.message}`));
    resolve(matches);
  });
});

const cleanHtmlFromDir = (path) => new Promise((resolve, reject) => {
  rimraf(`${path}/*.html`, (err) => {
    if (err) {
      reject(new Error(`Failed to clean files by path: ${path}. Error: ${err.message}`));
    }
    resolve();
  });
});

export default {
  readDir,
  cleanHtmlFromDir,
};
