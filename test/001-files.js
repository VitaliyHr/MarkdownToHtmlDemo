const { expect } = require("chai");
const fs = require("fs");
const helper = require("./helpers/index");
// const { default: logger } = require("../dist/services/logger");
const Mark = require("../dist/mark").default;

const mark = new Mark();
let files = [];
let result;
let postInfos = [];

describe("Mark", async () => {
  describe("Successfully clean dir", async () => {
    let res;
    it("Clean dir", async () => {
      result = await Mark.cleanDir(`${__dirname}/www-test/`);
      expect(result).to.be.equal(true);
    });
    it("Return empty dir", async () => {
      fs.readdir(`${__dirname}/www-test`, (err, f) => {
        if (err) {
          console.error("Failed to read directory", err);
          throw err;
        }
        res = f;
        expect(res).to.be.an("array");
        expect(res).to.haveOwnProperty("length").to.be.equal(0);
      });
    });
  });

  describe("Successfully get array files", async () => {
    it("Return is array", async () => {
      files = await mark.getArrayFiles(`${__dirname}/assets`);
      expect(files).to.be.an("array");
    });
    it("Return has at least one field", async () => {
      expect(files.length).to.be.greaterThan(0);
    });
    it(`Return such file as ${__dirname}/assets/node.md`, async () => {
      expect(files).includes(`${__dirname}/assets/node.md`);
    });
    it("Return array with 1 elements", async () => {
      expect(files.length).to.be.equal(1);
    });
  });

  describe("Successfully populate files", async () => {
    let data;
    it("Return array with data", async () => {
      data = await mark.populateFiles();
      expect(data).to.be.an("array");
    });
    it("Return array with 1 elements", async () => {
      expect(data.length).to.be.equal(1);
    });
    it("Return array with object", async () => {
      expect(data[0]).to.be.an("object");
    });
    it("Return array with object which has content", async () => {
      expect(data[0]).to.haveOwnProperty("content");
    });
    it("Return array with object which has path", async () => {
      expect(data[0]).to.haveOwnProperty("path");
    });
  });

  describe("Successfully get info", async () => {
    // let info;
    it("Return array", async () => {
      postInfos = await mark.getInfo();
      expect(postInfos).to.be.an("array");
    });
    it("Return array with 1 elements", async () => {
      expect(postInfos.length).to.be.equal(1);
    });
    it("Return array with object", async () => {
      expect(postInfos[0]).to.be.an("object");
    });
    it("Return array with object which has post", async () => {
      expect(postInfos[0]).to.haveOwnProperty("post");
    });
    it("Return array with object which has info", async () => {
      expect(postInfos[0]).to.haveOwnProperty("info");
    });
    it("Return array with object which has path", async () => {
      expect(postInfos[0]).to.haveOwnProperty("path");
    });
    it("Expect info to have own property postId", async () => {
      expect(postInfos[0].info).to.haveOwnProperty("postId");
    });
    it("Expect info to have own property date", async () => {
      expect(postInfos[0].info).to.haveOwnProperty("date");
    });
    it("Expect info to have own property title", async () => {
      expect(postInfos[0].info).to.haveOwnProperty("title");
    });
    it("Expect info to have own property author", async () => {
      expect(postInfos[0].info).to.haveOwnProperty("author");
    });
    it("Expect info to have own property description", async () => {
      expect(postInfos[0].info).to.haveOwnProperty("description");
    });
    it("Expect info to have own property image", async () => {
      expect(postInfos[0].info).to.haveOwnProperty("image");
    });
  });

  describe("Successfully transpile markdown to html", async () => {
    let arr;
    it("Return array", async () => {
      arr = mark.makeHTML();
      expect(arr).to.be.an("array");
    });
    it("Return array with inner Object", async () => {
      expect(arr[0]).to.be.an("object");
    });

    it("Return array with file", async () => {
      expect(arr[0]).to.haveOwnProperty("file");
    });
    it("Return array with info", async () => {
      expect(arr[0]).to.haveOwnProperty("info");
    });
    it("Return html in file", async () => {
      expect(arr[0].file).to.be.equal(helper.html);
    });
  });

  describe("Rendering index.pug to index.html", async () => {
    let res;
    it("Creates index.html file", async () => {
      mark.renderIndexPug(`${__dirname}/helpers/templates/index.pug`, `${__dirname}/www-test/index.html`);
      fs.readdir(`${__dirname}/www-test`, (err, f) => {
        if (err) {
          console.error("Failed to read directory", err);
          throw err;
        }
        res = f;
      });
    });
    it("Return array with index.html", async () => {
      expect(res[0]).to.be.equal("index.html");
    });
  });

  describe("Successfully rendering posts", async () => {
    let res;
    it("Render html files", async () => {
      mark.renderBlogPug(`${__dirname}/helpers/templates/blog.pug`, `${__dirname}/www-test`);
      fs.readdir(`${__dirname}/www-test`, (err, f) => {
        if (err) {
          console.error("Failed to read directory", err);
          throw err;
        }
        res = f;
      });
    });
    it("Return post-20.html", async () => {
      expect(res).to.include(`post-${postInfos[0].info.postId}.html`);
    });
  });
});
