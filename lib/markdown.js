/* eslint-disable no-return-assign */
const Twig = require('twig');
const Path = require('path');
const data = require('gulp-data');
const gulp = require('gulp');
const rename = require('gulp-rename');
const frontMatter = require('front-matter');
const Yaml = require('js-yaml');
const fs = require('fs');
const marked = require('marked');

const twigRender = (tpl, twigData) => {
  const twig = Twig.twig;
  const file = Path.join('.', 'templates', `${tpl}.twig`);
  const options = { path: file, async: false };
  const template = twig(options);
  return template.render(twigData);
};

const htmlTitle = (config, content) => {
  const siteName = config.site_name || 'Disaster Radio';
  const pageTitle = content.attributes.title;

  return (pageTitle) ? `${pageTitle} | ${siteName}` : siteName;
};

const renderedPageBody = (content) => {
  const layout = Path.join('layout', (content.attributes.layout || 'default'));
  const options = {
    page: content.attributes,
    body: content.body ? marked(content.body) : '',
  };
  return twigRender(layout, options);
};

const twigData = (config, file) => {
  const content = frontMatter(String(file.contents));
  return {
    html_title: String(htmlTitle(config, content)),
    html_description: content.attributes.description || config.description || '',
    html_keywords: content.attributes.keywords || config.keywords || '',
    page: content.attributes || {},
    body: renderedPageBody(content),
  };
};

const renderedFile = (config, file) => twigRender('html', twigData(config, file));

module.exports = () => {
  const config = Yaml.safeLoad(fs.readFileSync(Path.join('.', 'config.yml')));

  return gulp.src(['./src/**/*.md'])
    .pipe(data((file) => {
      file.contents = Buffer.from(String(renderedFile(config, file)));
      return file;
    }))
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest('./web', { mode: 'string' }));
};