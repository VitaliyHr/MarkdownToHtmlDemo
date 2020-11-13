"use strict";

import _ from "lodash";
import markdown from "./services/parsehtml";
import configSrv from "./services/config";
import dir from "./services/dir";
import file from "./services/file";
import info from "./services/fileinfo";
import logger from "./services/logger";
import render from "./services/pug";

export default class Mark {
  constructor() {
    this.files = [];

    this.infoArr = [];

    this.successPostArr = [];

    this.successIndexArr = [];

    this.totalIndex = 0;

    this.fileArr = [];
  }

  static async cleanDir(path) {
    if (!path || path.length === 0) {
      path = configSrv.getConfig("putDir");
    }

    try {
      await dir.cleanHtmlFromDir(path);
    } catch (err) {
      logger.error(err.message);
    }

    return true;
  }

  async getArrayFiles(path, settings) {
    if (!path || path.length === 0) {
      path = configSrv.getConfig("source");
    }

    if (!settings || settings.length === 0) {
      settings = configSrv.getConfig("dir");
    }

    try {
      this.files = await dir.readDir({ path, settings });
    } catch (err) {
      logger.error(err.message);
    }

    return this.files;
  }

  async populateFiles(pathList) {
    if (!pathList || pathList.length === 0) {
      pathList = _.get(this, "files", []);
    }

    for (const path of pathList) {
      let content;

      try {
        content = await file.readFile(path);
      } catch (err) {
        logger.error(err.message);
      }

      if (!content || content.length === 0) {
        logger.error(`A file ${path} is empty`);
      } else {
        this.fileArr.push({ content, path });
      }
    }

    return this.fileArr;
  }

  async getInfo(fileList) {
    if (!fileList || fileList.length === 0) {
      fileList = _.get(this, "fileArr", []);
    }

    for (const postFile of fileList) {
      let infos;

      try {
        infos = await info.getInfo(postFile.content, postFile.path);
      } catch (err) {
        logger.error(err.message);
      }

      if (!infos) {
        this.successPostArr.push(false);
        continue;
      }
      this.infoArr.push({ post: infos.postContent, info: infos.postInfo, path: postFile.path });
    }

    return this.infoArr;
  }

  sortElements(elements) {
    if (!elements) {
      elements = _.get(this, "infoArr", []);
    }

    const order = configSrv.getConfig("sortOrder");

    try {
      elements.sort((a, b) => {
        if (order === "desc") {
          return b.info.date.getTime() - a.info.date.getTime();
        }
        return a.info.date.getTime() - b.info.date.getTime();
      });
    } catch (err) {
      logger.error("Failed to sort elements", err.message);
    }
  }

  makeHTML() {
    for (const idx of this.infoArr) {
      let html;
      try {
        html = markdown.parse(idx.post);
      } catch (err) {
        logger.error(`Failed to parse html from ${idx.path}`, err.message);
      }
      idx.file = html;
    }
    return this.infoArr;
  }

  renderIndexPug(sourceDir, storageDir, settings) {
    this.totalIndex += 1;

    if (!sourceDir || sourceDir.length === 0) {
      sourceDir = configSrv.getConfig("sourcePugIndex");
    }

    if (!storageDir || storageDir.length === 0) {
      storageDir = configSrv.getConfig("putPugIndex");
    }

    if (!settings || settings.length === 0) {
      settings = configSrv.getConfig("file");
    }

    let htmlFn;
    try {
      htmlFn = render.renderPug({ path: sourceDir, settings: configSrv.getConfig("pug") });
    } catch (err) {
      logger.error("Failed to create render function for index page", err.message);
    }

    try {
      file.writeFile(storageDir, htmlFn({ values: this.infoArr }), settings);
      this.successIndexArr.push(true);
    } catch (err) {
      logger.error("Failed to write index.html file", err.message);
      this.successIndexArr.push(false);
    }
  }

  renderBlogPug(sourceDir, storageDir, settings) {
    if (!sourceDir || sourceDir.length === 0) {
      sourceDir = configSrv.getConfig("sourcePugPost");
    }

    if (!storageDir || storageDir.length === 0) {
      storageDir = configSrv.getConfig("putDir");
    }

    if (!settings || settings.length === 0) {
      settings = configSrv.getConfig("file");
    }

    let htmlFn;
    try {
      htmlFn = render.renderPug({ path: sourceDir, settings: configSrv.getConfig("pug") });
    } catch (err) {
      logger.error("Failed to create render function for post page", err.message);
    }

    for (const idx of this.infoArr) {
      const filename = `${storageDir}/post-${idx.info.postId}.html`;
      try {
        file.writeFile(filename, htmlFn({ values: { info: idx.info, html: idx.file } }), settings);
        this.successPostArr.push(true);
        logger.info(`A file post-${idx.info.postId}.html and postId ${idx.info.postId} is written to html`);
      } catch (err) {
        logger.error(err.message, `postId: ${idx.info.postId}, file: post-${idx.info.postId}.html`);
        this.successPostArr.push(false);
      }
    }
  }

  getStats() {
    const successIndex = this.successIndexArr.filter((i) => i === true);
    const successPost = this.successPostArr.filter((p) => p === true);
    const errorIndex = this.successIndexArr.filter((i) => i === false);
    const errorPost = this.successPostArr.filter((p) => p === false);

    logger.info("\x1b[33m", `Processed ${successIndex.length} of ${this.totalIndex} index pages`);
    logger.info("\x1b[33m", `Processed ${successPost.length} of ${this.files.length} post pages \n`);
    logger.info("\x1b[32m", `Total files: \t\t ${this.files.length + this.totalIndex}`);
    logger.info("\x1b[32m", `Total processed: \t ${successPost.length + successIndex.length}`);
    logger.info("\x1b[31m", `Total crushed: \t ${errorIndex.length + errorPost.length}`);
  }
}
