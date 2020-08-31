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

export default (state, elements) => {
  const {
    urlField,
    submitButton,
    feedbackElement,
    feedsContainer,
  } = elements;

  const renderFeedbackMessage = ({ type, message }) => {
    urlField.classList.remove('is-invalid');
    feedbackElement.classList.remove('text-danger', 'text-success');
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

  const changeDisabledPropertyOfFormElements = (isDisabled) => {
    submitButton.disabled = isDisabled;
    urlField.disabled = isDisabled;
  };

  const processStateHandler = (processState) => {
    switch (processState) {
      case processStatuses.FAILED:
        changeDisabledPropertyOfFormElements(false);
        break;
      case processStatuses.FILLING:
        changeDisabledPropertyOfFormElements(false);
        break;
      case processStatuses.SENDING:
        changeDisabledPropertyOfFormElements(true);
        break;
      case processStatuses.FINISHED:
        changeDisabledPropertyOfFormElements(false);
        urlField.value = '';
        renderFeedbackMessage(
          { type: systemStatuses.SUCCESS, message: i18n.t('loadedSuccess') },
        );
        break;
      default:
        throw new Error(i18n.t('unknownState', { processState }));
    }
  };

  const renderFeeds = (feeds, posts) => {
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

  return onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value);
        break;
      case 'form.valid':
        changeDisabledPropertyOfFormElements(true);
        break;
      case 'form.error':
        changeDisabledPropertyOfFormElements(false);
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
};
