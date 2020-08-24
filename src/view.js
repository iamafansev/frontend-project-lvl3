import onChange from 'on-change';
import i18n from 'i18next';

import {
  systemStatuses,
  processStatuses,
} from './constants';

let isSetElements = false;
const elements = {
  urlField: null,
  submitButton: null,
  feedbackElement: null,
  feedsContainer: null,
};

const renderPost = ({ link, title }) => (
  `<div><a href="${link}" target="_blank">${title}</a></div>`
);

const renderFeed = (feed) => {
  const title = `<h2>${feed.title}</h2>`;
  const posts = feed.posts.map(renderPost).join('');

  return [title, posts].join('');
};

const renderFeedbackMessage = ({ type, message }) => {
  elements.urlField.classList.remove('is-invalid');
  elements.feedbackElement.classList.remove('text-danger');
  elements.feedbackElement.classList.remove('text-success');
  elements.feedbackElement.textContent = '';

  if (type === systemStatuses.SUCCESS) {
    elements.feedbackElement.classList.add('text-success');
  }

  if (type === systemStatuses.ERROR) {
    elements.feedbackElement.classList.add('text-danger');
    elements.urlField.classList.add('is-invalid');
  }

  elements.feedbackElement.textContent = message;
};

const renderFeeds = (feeds, posts) => {
  const postsByFeedId = posts.reduce((acc, post) => {
    const { feedId } = post;
    const alreadyExistsPostsInAcc = acc[feedId] || [];
    return { ...acc, [feedId]: [...alreadyExistsPostsInAcc, post] };
  }, {});

  elements.feedsContainer.innerHTML = feeds
    .map((feed) => {
      const currentPosts = postsByFeedId[feed.id];
      return renderFeed({ ...feed, posts: currentPosts });
    })
    .join('');
};

const processStateHandler = (processState) => {
  switch (processState) {
    case processStatuses.FAILED:
      elements.submitButton.disabled = false;
      break;
    case processStatuses.FILLING:
      elements.submitButton.disabled = false;
      break;
    case processStatuses.SENDING:
      elements.submitButton.disabled = true;
      break;
    case processStatuses.FINISHED:
      elements.submitButton.disabled = false;
      elements.urlField.value = '';
      renderFeedbackMessage(
        { type: systemStatuses.SUCCESS, message: i18n.t('loadedSuccess') },
      );
      break;
    default:
      throw new Error(i18n.t('unknownState', { processState }));
  }
};

const renderSubmitButton = (isDisabled) => {
  elements.submitButton.disabled = isDisabled;
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
  if (!isSetElements) {
    elements.urlField = urlField;
    elements.submitButton = submitButton;
    elements.feedbackElement = feedbackElement;
    elements.feedsContainer = feedsContainer;
    isSetElements = true;
  }

  switch (path) {
    case 'form.processState':
      processStateHandler(value);
      break;
    case 'form.valid':
      renderSubmitButton(!value);
      break;
    case 'form.error':
      renderSubmitButton(false, { submitButton });
      renderFeedbackMessage(
        { type: systemStatuses.ERROR, message: value },
      );
      break;
    case 'posts':
      renderFeeds(state.feeds, state.posts);
      break;
    default:
      break;
  }
});
