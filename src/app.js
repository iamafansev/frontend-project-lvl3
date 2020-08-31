import * as _ from 'lodash';
import axios from 'axios';
import i18n from 'i18next';

import resources from './locales';
import { processStatuses, errorTypes } from './constants';
import validate from './validate';
import parseFeed from './parseFeed';
import composeWatchedState from './view';

const FEEDS_UPDATE_DELAY = 5000;
const COUNT_FEEDS_WHEN_NEED_START_UPDATER = 1;

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

const startFeedsUpdater = (watchedState) => {
  const { feeds, posts } = watchedState;

  setTimeout(() => {
    const promises = feeds.map(({ id, link }) => {
      const urlWithCorsApi = buildUrlWithCorsProxy(link);

      return getParsedFeedData(urlWithCorsApi, id)
        .then((data) => {
          const difference = _.differenceWith(data.posts, posts, _.isEqual);

          if (!_.isEmpty(difference)) {
            watchedState.posts.unshift(...difference);
          }
        });
    });

    Promise
      .all(promises)
      .finally(() => startFeedsUpdater(watchedState));
  }, FEEDS_UPDATE_DELAY);
};

const updateValidationState = (error, watchedState) => {
  watchedState.form.valid = !error;
  watchedState.form.error = error;
};

const app = () => {
  const state = {
    form: {
      processState: processStatuses.FILLING,
      valid: true,
      error: null,
    },
    feeds: [],
    posts: [],
  };

  const form = document.getElementById('rss-form');

  const elements = {
    urlField: document.getElementById('url'),
    submitButton: document.getElementById('submit-rss-form'),
    feedbackElement: document.getElementById('feedback'),
    feedsContainer: document.getElementById('feeds'),
  };

  const watchedState = composeWatchedState(state, elements);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const urlFieldValue = formData.get('url');
    const trimedUrlFieldValue = urlFieldValue.trim();
    const alreadyUsedRssLinks = watchedState.feeds.map(({ link }) => link);

    const error = validate(trimedUrlFieldValue, alreadyUsedRssLinks);
    const isValidForm = !error;

    updateValidationState(error, watchedState);

    if (!isValidForm) return;

    watchedState.form.processState = processStatuses.SENDING;

    const urlWithCorsProxy = buildUrlWithCorsProxy(trimedUrlFieldValue);

    getParsedFeedData(urlWithCorsProxy)
      .then(({ posts, feed }) => {
        const feedWithLink = { link: trimedUrlFieldValue, ...feed };
        watchedState.feeds = [feedWithLink, ...watchedState.feeds];
        watchedState.posts.push(...posts);
        watchedState.form.processState = processStatuses.FINISHED;

        if (state.feeds.length === COUNT_FEEDS_WHEN_NEED_START_UPDATER) {
          startFeedsUpdater(watchedState);
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

export default () => {
  i18n.init({
    lng: 'en',
    resources,
  }).then(app);
};
