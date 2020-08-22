/* eslint-disable no-param-reassign, no-console  */
import * as _ from 'lodash';
import axios from 'axios';
import i18n from 'i18next';

import resources from './locales';
import { processStatuses, errorTypes } from './constants';
import validate from './helpers/validate';
import parseFeed from './helpers/parseFeed';
import composeWatchedState from './view';

const FEEDS_UPDATE_DELAY = 5000;

const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
const buildUrlWithCorsProxy = (url) => `${CORS_PROXY_URL}${url}`;

const assignIdsToData = (feedId) => ({ items: posts, ...feed }) => {
  const id = feedId || _.uniqueId();
  const feedWithId = { ...feed, id };
  const postsWithFeedId = posts.map((post) => ({ ...post, feedId: id }));

  return { id, feed: feedWithId, posts: postsWithFeedId };
};

const getParsedFeedData = (urlWithCorsApi, id = null) => axios.get(urlWithCorsApi)
  .then(({ data }) => parseFeed(data))
  .then(assignIdsToData(id));

const startFeedsUpdater = (previousPosts, watchedState) => {
  let nextPosts = previousPosts;

  setTimeout(() => {
    const promises = watchedState.feeds.map(({ id, link }) => {
      const urlWithCorsApi = buildUrlWithCorsProxy(link);

      return getParsedFeedData(urlWithCorsApi, id)
        .then(({ posts }) => {
          const difference = _.differenceWith(posts, previousPosts, _.isEqual);

          if (!_.isEmpty(difference)) {
            nextPosts = [...difference, ...previousPosts];
            watchedState.posts = nextPosts;
          }
        });
    });

    Promise
      .all(promises)
      .finally(() => startFeedsUpdater(nextPosts, watchedState));
  }, FEEDS_UPDATE_DELAY);
};

const updateValidationState = (error, watchedState) => {
  watchedState.form.valid = !error;
  watchedState.form.error = error;
};

export default () => {
  let isStartedFeedsUpdater = false;
  const state = {
    form: {
      processState: processStatuses.FILLING,
      valid: true,
      error: null,
    },
    feeds: [],
    posts: [],
  };

  i18n.init({
    lng: 'en',
    resources,
  });

  const form = document.getElementById('rss-form');
  const urlField = document.getElementById('url');
  const submitButton = document.getElementById('submit-rss-form');
  const feedbackElement = document.getElementById('feedback');
  const feedsContainer = document.getElementById('feeds');

  const watchedState = composeWatchedState(state, {
    urlField,
    submitButton,
    feedbackElement,
    feedsContainer,
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlFieldValue = new FormData(form).get('url').trim();
    const alreadyUsedRssLinks = watchedState.feeds.map(({ link }) => link);

    const error = validate(urlFieldValue, alreadyUsedRssLinks);
    const isValidForm = !error;

    updateValidationState(error, watchedState);

    if (!isValidForm) return;

    watchedState.form.processState = processStatuses.SENDING;

    const urlWithCorsApi = buildUrlWithCorsProxy(urlFieldValue);

    getParsedFeedData(urlWithCorsApi)
      .then(({ posts, feed }) => {
        const feedWithLink = { link: urlFieldValue, ...feed };
        watchedState.feeds = [feedWithLink, ...watchedState.feeds];
        watchedState.posts.push(...posts);
        watchedState.form.processState = processStatuses.FINISHED;

        if (!isStartedFeedsUpdater) {
          startFeedsUpdater(state.posts, watchedState);
          isStartedFeedsUpdater = true;
        }
      })
      .catch((err) => {
        if (err.name === errorTypes.PARSE) {
          watchedState.form.error = i18n.t('errors.parseFeed');
        } else {
          watchedState.form.error = i18n.t('errors.network');
        }

        watchedState.form.processState = processStatuses.FAILED;
        throw err;
      });
  });
};
