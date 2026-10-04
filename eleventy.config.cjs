module.exports = function (eleventyConfig) {
  eleventyConfig.configureErrorReporting({
    allowMissingExtensions: true
  });

  for (const directory of ['assets', 'images', 'documents']) {
    eleventyConfig.addPassthroughCopy({ [`src/${directory}`]: directory });
  }

  eleventyConfig.addWatchTarget('./content/');
  eleventyConfig.addWatchTarget('./src/_includes/');

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      output: '_site'
    },
    templateFormats: ['11ty.js']
  };
};
