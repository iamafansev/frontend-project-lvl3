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
  if (_.isEqual(current, previous) || !path.startsWith('postsByFeedId')) {
    return;
  }

  const { feeds, postsByFeedId } = state;

  console.log(postsByFeedId);

  const differenceBetweenPosts = _.differenceWith(previous, current, _.isEqual);

  if (_.isEmpty(differenceBetweenPosts) && !_.isNil(previous)) return;

  const feedsContainer = document.getElementById('feeds');
  feedsContainer.innerHTML = feeds
    .map((feed) => {
      const posts = postsByFeedId[feed.id];
      return renderFeed({ ...feed, posts });
    })
    .join('');
});
