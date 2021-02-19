const express = require('express');
const router = express.Router();

const fs = require('fs');
const template = require('../lib/template.js');
const sanitizeHtml = require('sanitize-html');
const path = require('path');
const { kMaxLength } = require('buffer');

router.get('*', (req, response, next) => {
  fs.readdir('./data', (error, filelist) => {
    req.list = filelist;
    next();
  });
});

router.get('/create', (req, res) => {
  var title = 'WEB - create';
  var list = template.list(req.list);
  var html = template.HTML(title, list, `
      <form action="/topic/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
          <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
    `, '');
  res.send(html);
});

router.post('/create_process', (req, res) => {
  var post = req.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf-8', (err) => {
    res.writeHead(302, { Location: `/topic/${title}` });
    res.end();
  });
});

router.get('/', (req, res) => {
  var title = "Welcome Minhyeok";
  var description = 'Hello, Node.js';
  var list = template.list(req.list);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description}`,
    `<a href="/topic/create">create</a>`);
  res.send(html);
});

router.get('/:pageId', (req, res, next) => {
  var filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf-8', (error, description) => {
    if(error){
      next(error);
    } else {
      var title = req.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ['h1']
      });
      var list = template.list(req.list);
      var html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        `<a href="/topic/create">create</a>
          <a href="/topic/update/${sanitizedTitle}">update</a>
                  <form action="delete_process" method="post">
                    <input type="hidden" name="id" value="${sanitizedTitle}">
                    <input type="submit" value="delete">
                  </form>`);
      res.send(html);
    }
  });
});





router.get('/update/:pageId', (req, res) => {
  var filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf-8', (err, description) => {
    var title = req.params.pageId;
    var list = template.list(req.list);
    var html = template.HTML(title, list,
      ` <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
      `<a href="/create">create</a> <a href="/update/${title}">update</a>`
    );
    res.send(html);
  });
});

router.post('/update_process', (req, res) => {
  var post = req.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, (error) => {
    fs.writeFile(`data/${title}`, description, 'utf-8', (err) => {
      res.writeHead(302, { Location: `/page/${title}` });
      res.end();
    });
  });
});

router.post('/page/delete_process', (req, res) => {
  var post = req.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    res.writeHead(302, { Location: `/` });
    res.end();
  })
});

module.exports = router;