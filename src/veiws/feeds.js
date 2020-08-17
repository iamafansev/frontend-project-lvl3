import onChange from 'on-change';
import * as _ from 'lodash';

const renderItem = ({ link, title }) => (
  `<div><a href="${link}" target="_blank">${title}</a></div>`
);

const renderFeed = (feed) => {
  const title = `<h2>${feed.title}</h2>`;
  const items = feed.items.map(renderItem).join('');

  return [title, items].join('');
};

const renderFeeds = (feeds) => {
  const feedsContainer = document.getElementById('feeds');
  feedsContainer.innerHTML = feeds.map(renderFeed).join('');
};

export default (state) => onChange(state, (path, current, previous) => {
  if (_.isEqual(current, previous)) {
    return;
  }

  console.log(current);

  renderFeeds(current);
});
