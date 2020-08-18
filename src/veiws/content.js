import onChange from 'on-change';
import * as _ from 'lodash';

const renderPost = ({ link, title }) => (
  `<div><a href="${link}" target="_blank">${title}</a></div>`
);

const renderFeed = (feed) => {
  const title = `<h2>${feed.title}</h2>`;
  const posts = feed.posts.map(renderPost).join('');

  return [title, posts].join('');
};

export default (state) => onChange(state, (path, current, previous) => {
  if (_.isEqual(current, previous)) {
    return;
  }

  const { feeds, posts } = state;

  const postsByFeedId = posts.reduce((acc, post) => {
    const { feedId } = post;
    const alreadyExistsPostsInAcc = acc[feedId] || [];

    return { ...acc, [feedId]: [...alreadyExistsPostsInAcc, post] };
  }, {});

  const feedsContainer = document.getElementById('feeds');
  feedsContainer.innerHTML = feeds
    .map((feed) => {
      const currentPosts = postsByFeedId[feed.id] || [];
      return renderFeed({ ...feed, posts: currentPosts });
    })
    .join('');
});
