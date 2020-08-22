/* eslint-disable no-param-reassign, no-console  */
import onChange from 'on-change';
import i18n from 'i18next';

import {
  systemStatuses,
  processStatuses,
} from './constants';

const renderPost = ({ link, title }) => (
  `<div><a href="${link}" target="_blank">${title}</a></div>`
);

const renderFeed = (feed) => {
  const title = `<h2>${feed.title}</h2>`;
  const posts = feed.posts.map(renderPost).join('');

  return [title, posts].join('');
};

const renderFeedbackMessage = ({ type, message }, { urlField, feedbackElement }) => {
  urlField.classList.remove('is-invalid');
  feedbackElement.classList.remove('text-danger');
  feedbackElement.classList.remove('text-success');
  feedbackElement.textContent = '';

  if (type === systemStatuses.SUCCESS) {
    feedbackElement.classList.add('text-success');
  }

  if (type === systemStatuses.ERROR) {
    feedbackElement.classList.add('text-danger');
    urlField.classList.add('is-invalid');
  }

  feedbackElement.textContent = message;
};

const renderFeeds = (feeds, posts, { feedsContainer }) => {
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
};

const processStateHandler = (processState, { urlField, submitButton, feedbackElement }) => {
  switch (processState) {
    case processStatuses.FAILED:
      submitButton.disabled = false;
      break;
    case processStatuses.FILLING:
      submitButton.disabled = false;
      break;
    case processStatuses.SENDING:
      submitButton.disabled = true;
      break;
    case processStatuses.FINISHED:
      submitButton.disabled = false;
      urlField.value = '';
      renderFeedbackMessage(
        { type: systemStatuses.SUCCESS, message: i18n.t('loadedSuccess') },
        { urlField, feedbackElement },
      );
      break;
    default:
      throw new Error(i18n.t('unknownState', { processState }));
  }
};

export default (
  state,
  {
    urlField,
    submitButton,
    feedbackElement,
    feedsContainer,
  },
) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.processState':
      processStateHandler(value, { urlField, submitButton, feedbackElement });
      break;
    case 'form.valid':
      submitButton.disabled = !value;
      break;
    case 'form.error':
      submitButton.disabled = false;
      renderFeedbackMessage(
        { type: systemStatuses.ERROR, message: value },
        { urlField, feedbackElement },
      );
      break;
    case 'posts':
      renderFeeds(state.feeds, state.posts, { feedsContainer });
      break;
    default:
      break;
  }
});
