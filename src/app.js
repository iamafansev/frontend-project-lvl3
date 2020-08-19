/* eslint-disable no-param-reassign, no-console  */
import * as _ from 'lodash';
import axios from 'axios';

import { processStatuses, errorMessages } from './constants';
import validate from './helpers/validate';
import parseFeed from './helpers/parseFeed';
import composeWatchedFormState from './veiws/form';
import composeWatchedContentState from './veiws/content';

const FEEDS_UPDATE_DELAY = 5000;

const CORS_API_URL = 'https://cors-anywhere.herokuapp.com/';
const buildUrlWithCorsApi = (url) => `${CORS_API_URL}${url}`;

const assignIdsToData = (feedId) => ({ items: posts, ...feed }) => {
  const id = feedId || _.uniqueId();
  const feedWithId = { ...feed, id };
  const postsWithFeedId = posts.map((post) => ({ ...post, feedId }));

  return { id, feed: feedWithId, posts: postsWithFeedId };
};

const startFeedUpdateTimer = (url, feedId, watchedState) => {
  setTimeout(
    () => axios.get(url)
      .then(({ data }) => parseFeed(data))
      .then(assignIdsToData(feedId))
      .then(({ posts }) => {
        watchedState.postsByFeedId[feedId] = posts;
      })
      .finally(() => startFeedUpdateTimer(url, feedId, watchedState)),
    FEEDS_UPDATE_DELAY,
  );
};

const updateValidationState = (error, watchedState) => {
  watchedState.valid = !error;
  watchedState.error = error;
};

export default function App() {
  const state = {
    form: {
      processState: processStatuses.FILLING,
      valid: true,
      error: null,
    },
    feeds: [],
    postsByFeedId: {},
  };

  const form = document.querySelector('[data-form="rss-form"]');
  const urlField = form.elements.url;

  const watchedFormState = composeWatchedFormState(state.form);
  const watchedContentState = composeWatchedContentState(_.omit(state, ['form']));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlFieldValue = urlField.value.trim();
    const alreadyUsedRssLinks = watchedContentState.feeds.map(({ link }) => link);

    const error = validate(urlFieldValue, alreadyUsedRssLinks);
    const isValidForm = !error;

    updateValidationState(error, watchedFormState);

    if (!isValidForm) return;

    watchedFormState.processState = processStatuses.SENDING;

    const urlWithCorsApi = buildUrlWithCorsApi(urlFieldValue);

    axios.get(urlWithCorsApi)
      .then(({ data }) => parseFeed(data))
      .then(assignIdsToData())
      .then(({ id, posts, feed }) => {
        watchedContentState.feeds = [feed, ...watchedContentState.feeds];
        watchedContentState.postsByFeedId[id] = posts;
        watchedFormState.processState = processStatuses.FINISHED;
        startFeedUpdateTimer(urlWithCorsApi, id, watchedContentState);
      })
      .catch((err) => {
        watchedFormState.error = errorMessages.NETWORK;
        watchedFormState.processState = processStatuses.FAILED;
        throw err;
      });
  });
}
