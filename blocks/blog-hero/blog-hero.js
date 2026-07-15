/* Alias: some authored pages reference this block as `blog-hero`, others as
   `hero-blog`. Both share one implementation — delegate to the hero-blog block. */
import decorate from '../hero-blog/hero-blog.js';

export default function decorateBlogHero(block) {
  return decorate(block);
}
