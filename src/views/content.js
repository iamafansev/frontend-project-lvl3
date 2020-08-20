/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const renderPost = ({ link, title }) => (
  `<div><a href="${link}" target="_blank">${title}</a></div>`
);

const renderFeed = (feed) => {
  const title = `<h2>${feed.title}</h2>`;
  const posts = feed.posts.map(renderPost).join('');

  return [title, posts].join('');
};

export default (state, { feedsContainer }) => onChange(state, (path) => {
  if (path === 'feeds') {
    return;
  }

  const { feeds, posts } = state;

  const postsByFeedId = posts.reduce((acc, post) => {
    const { feedId } = post;
    const alreadyExistsPostsInAcc = acc[feedId] || [];
    return { ...acc, [feedId]: [...alreadyExistsPostsInAcc, post] };
  }, {});

  feedsContainer.innerHTML = feeds
    .map((feed) => {
      const currentPosts = postsByFeedId[feed.id];
      return renderFeed({ ...feed, posts: currentPosts });
    })
    .join('');
});
