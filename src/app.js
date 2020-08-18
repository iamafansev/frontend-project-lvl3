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

const startFeedUpdateTimer = (url, feedId, previousPosts, watchedState) => {
  let nextState = previousPosts;
  setTimeout(
    () => axios.get(url)
      .then(({ data }) => {
        const { items: posts } = parseFeed(data);
        const postsWithFeedId = posts.map((post) => ({ ...post, feedId }));
        const difference = _.differenceWith(previousPosts, postsWithFeedId, _.isEqual);

        if (!_.isEmpty(difference)) {
          nextState = [...postsWithFeedId, ...difference];
          watchedState.posts = nextState;
        }
      })
      .finally(() => startFeedUpdateTimer(url, feedId, nextState, watchedState)),
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
    posts: [],
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
      .then((parsedData) => {
        const { items: posts, ...feed } = parsedData;
        const id = _.uniqueId();
        const postsWithFeedId = posts.map((post) => ({ ...post, feedId: id }));

        watchedContentState.feeds.push({ ...feed, id });
        watchedContentState.posts.push(...postsWithFeedId);
        watchedFormState.processState = processStatuses.FINISHED;

        startFeedUpdateTimer(urlWithCorsApi, id, state.posts, watchedContentState);
      })
      .catch((err) => {
        watchedFormState.error = errorMessages.NETWORK;
        watchedFormState.processState = processStatuses.FAILED;
        throw err;
      });
  });
}
